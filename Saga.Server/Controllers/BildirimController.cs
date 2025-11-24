using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Saga.Server.Data;
using Saga.Server.Models;
using System.Security.Claims;

namespace Saga.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BildirimController : ControllerBase
    {
        private readonly SagaDbContext _context;
        private readonly ILogger<BildirimController> _logger;

        public BildirimController(SagaDbContext context, ILogger<BildirimController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                throw new UnauthorizedAccessException("Kullanıcı ID'si bulunamadı");
            }
            return Guid.Parse(userIdClaim);
        }

        // GET: api/bildirim
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetBildirimler(
            [FromQuery] int sayfa = 1,
            [FromQuery] int limit = 20)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var bildirimler = await _context.Bildirimler
                    .Where(b => b.AliciId == kullaniciId && !b.Silindi)
                    .OrderByDescending(b => b.OlusturulmaZamani)
                    .Skip((sayfa - 1) * limit)
                    .Take(limit)
                    .Include(b => b.Gonderen)
                    .Select(b => new
                    {
                        b.Id,
                        b.Tip,
                        b.Baslik,
                        b.Mesaj,
                        b.LinkUrl,
                        b.Okundu,
                        b.OlusturulmaZamani,
                        Gonderen = b.Gonderen == null ? null : new
                        {
                            b.Gonderen.Id,
                            b.Gonderen.KullaniciAdi,
                            b.Gonderen.AvatarUrl
                        }
                    })
                    .ToListAsync();

                var toplamSayisi = await _context.Bildirimler
                    .Where(b => b.AliciId == kullaniciId && !b.Silindi)
                    .CountAsync();

                return Ok(new
                {
                    bildirimler,
                    toplamSayisi,
                    sayfa,
                    toplamSayfa = (int)Math.Ceiling(toplamSayisi / (double)limit)
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Yetkisiz erişim" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Bildirimler getirilirken hata oluştu");
                return StatusCode(500, new { message = "Bildirimler getirilirken bir hata oluştu" });
            }
        }

        // GET: api/bildirim/okunmamis
        [HttpGet("okunmamis")]
        public async Task<ActionResult<IEnumerable<object>>> GetOkunmamisBildirimler()
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var bildirimler = await _context.Bildirimler
                    .Where(b => b.AliciId == kullaniciId && !b.Okundu && !b.Silindi)
                    .OrderByDescending(b => b.OlusturulmaZamani)
                    .Include(b => b.Gonderen)
                    .Select(b => new
                    {
                        b.Id,
                        b.Tip,
                        b.Baslik,
                        b.Mesaj,
                        b.LinkUrl,
                        b.OlusturulmaZamani,
                        Gonderen = b.Gonderen == null ? null : new
                        {
                            b.Gonderen.Id,
                            b.Gonderen.KullaniciAdi,
                            b.Gonderen.AvatarUrl
                        }
                    })
                    .ToListAsync();

                var okunmamisSayisi = bildirimler.Count;

                return Ok(new
                {
                    bildirimler,
                    okunmamisSayisi
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Yetkisiz erişim" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Okunmamış bildirimler getirilirken hata oluştu");
                return StatusCode(500, new { message = "Bildirimler getirilirken bir hata oluştu" });
            }
        }

        // GET: api/bildirim/sayisi
        [HttpGet("sayisi")]
        public async Task<ActionResult<object>> GetOkunmamisSayisi()
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var okunmamisSayisi = await _context.Bildirimler
                    .Where(b => b.AliciId == kullaniciId && !b.Okundu && !b.Silindi)
                    .CountAsync();

                return Ok(new { okunmamisSayisi });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Yetkisiz erişim" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Okunmamış bildirim sayısı alınırken hata oluştu");
                return StatusCode(500, new { message = "Bildirim sayısı alınırken bir hata oluştu" });
            }
        }

        // POST: api/bildirim/{id}/okundu
        [HttpPost("{id}/okundu")]
        public async Task<ActionResult> BildirimeOkunduIsaretle(long id)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var bildirim = await _context.Bildirimler
                    .FirstOrDefaultAsync(b => b.Id == id && b.AliciId == kullaniciId);

                if (bildirim == null)
                {
                    return NotFound(new { message = "Bildirim bulunamadı" });
                }

                bildirim.Okundu = true;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Bildirim okundu olarak işaretlendi" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Yetkisiz erişim" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Bildirim okundu işaretlenirken hata oluştu: {BildirimId}", id);
                return StatusCode(500, new { message = "Bildirim güncellenirken bir hata oluştu" });
            }
        }

        // POST: api/bildirim/tumunu-okundu-isaretle
        [HttpPost("tumunu-okundu-isaretle")]
        public async Task<ActionResult> TumunuOkunduIsaretle()
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                await _context.Bildirimler
                    .Where(b => b.AliciId == kullaniciId && !b.Okundu && !b.Silindi)
                    .ExecuteUpdateAsync(b => b.SetProperty(x => x.Okundu, true));

                return Ok(new { message = "Tüm bildirimler okundu olarak işaretlendi" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Yetkisiz erişim" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Tüm bildirimler okundu işaretlenirken hata oluştu");
                return StatusCode(500, new { message = "Bildirimler güncellenirken bir hata oluştu" });
            }
        }

        // DELETE: api/bildirim/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> BildirimSil(long id)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var bildirim = await _context.Bildirimler
                    .FirstOrDefaultAsync(b => b.Id == id && b.AliciId == kullaniciId);

                if (bildirim == null)
                {
                    return NotFound(new { message = "Bildirim bulunamadı" });
                }

                bildirim.Silindi = true;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Bildirim silindi" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Yetkisiz erişim" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Bildirim silinirken hata oluştu: {BildirimId}", id);
                return StatusCode(500, new { message = "Bildirim silinirken bir hata oluştu" });
            }
        }

        // DELETE: api/bildirim/tumunu-sil
        [HttpDelete("tumunu-sil")]
        public async Task<ActionResult> TumBildirimleriSil()
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                await _context.Bildirimler
                    .Where(b => b.AliciId == kullaniciId && !b.Silindi)
                    .ExecuteUpdateAsync(b => b.SetProperty(x => x.Silindi, true));

                return Ok(new { message = "Tüm bildirimler silindi" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Yetkisiz erişim" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Tüm bildirimler silinirken hata oluştu");
                return StatusCode(500, new { message = "Bildirimler silinirken bir hata oluştu" });
            }
        }

        // POST: api/bildirim/test (Development only - test bildirimi oluştur)
        [HttpPost("test")]
        [Authorize(Roles = "yonetici")]
        public async Task<ActionResult> TestBildirimiOlustur([FromBody] TestBildirimDto model)
        {
            try
            {
                var gonderen = GetCurrentUserId();

                var bildirim = new Bildirim
                {
                    AliciId = model.AliciId,
                    GonderenId = gonderen,
                    Tip = model.Tip ?? "genel",
                    Baslik = model.Baslik,
                    Mesaj = model.Mesaj,
                    LinkUrl = model.LinkUrl,
                    OlusturulmaZamani = DateTime.UtcNow
                };

                _context.Bildirimler.Add(bildirim);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Test bildirimi oluşturuldu", bildirimId = bildirim.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Test bildirimi oluşturulurken hata oluştu");
                return StatusCode(500, new { message = "Bildirim oluşturulurken bir hata oluştu" });
            }
        }
    }

    public class TestBildirimDto
    {
        public Guid AliciId { get; set; }
        public string? Tip { get; set; }
        public string Baslik { get; set; } = string.Empty;
        public string Mesaj { get; set; } = string.Empty;
        public string? LinkUrl { get; set; }
    }
}
