using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Saga.Server.Data;
using Saga.Server.DTOs;
using Saga.Server.Models;

namespace Saga.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BildirimController : BaseApiController
    {
        private readonly SagaDbContext _context;
        private readonly ILogger<BildirimController> _logger;

        public BildirimController(SagaDbContext context, ILogger<BildirimController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/bildirim
        [HttpGet]
    public async Task<ActionResult<BildirimListResponseDto>> GetBildirimler(
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
                    .ToListAsync();

                var toplamSayisi = await _context.Bildirimler
                    .Where(b => b.AliciId == kullaniciId && !b.Silindi)
                    .CountAsync();

                var response = new BildirimListResponseDto
                {
                    Bildirimler = bildirimler.Select(b => new BildirimDto
                    {
                        Id = b.Id,
                        Tip = b.Tip,
                        Baslik = b.Baslik,
                        Mesaj = b.Mesaj,
                        LinkUrl = b.LinkUrl,
                        Okundu = b.Okundu,
                        OlusturulmaZamani = b.OlusturulmaZamani,
                        Gonderen = b.Gonderen == null ? null : new BildirimKullaniciDto
                        {
                            Id = b.Gonderen.Id,
                            KullaniciAdi = b.Gonderen.KullaniciAdi,
                            AvatarUrl = b.Gonderen.AvatarUrl
                        }
                    }).ToList(),
                    ToplamSayisi = toplamSayisi,
                    Sayfa = sayfa,
                    ToplamSayfa = (int)Math.Ceiling(toplamSayisi / (double)limit)
                };

                return Ok(response);
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
    public async Task<ActionResult<OkunmamisBildirimlerResponseDto>> GetOkunmamisBildirimler()
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var bildirimler = await _context.Bildirimler
                    .Where(b => b.AliciId == kullaniciId && !b.Okundu && !b.Silindi)
                    .OrderByDescending(b => b.OlusturulmaZamani)
                    .Include(b => b.Gonderen)
                    .ToListAsync();

                var okunmamisSayisi = bildirimler.Count;

                var response = new OkunmamisBildirimlerResponseDto
                {
                    Bildirimler = bildirimler.Select(b => new BildirimDto
                    {
                        Id = b.Id,
                        Tip = b.Tip,
                        Baslik = b.Baslik,
                        Mesaj = b.Mesaj,
                        LinkUrl = b.LinkUrl,
                        Okundu = b.Okundu,
                        OlusturulmaZamani = b.OlusturulmaZamani,
                        Gonderen = b.Gonderen == null ? null : new BildirimKullaniciDto
                        {
                            Id = b.Gonderen.Id,
                            KullaniciAdi = b.Gonderen.KullaniciAdi,
                            AvatarUrl = b.Gonderen.AvatarUrl
                        }
                    }).ToList(),
                    OkunmamisSayisi = okunmamisSayisi
                };

                return Ok(response);
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
    public async Task<ActionResult<OkunmamisSayisiDto>> GetOkunmamisSayisi()
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var okunmamisSayisi = await _context.Bildirimler
                    .Where(b => b.AliciId == kullaniciId && !b.Okundu && !b.Silindi)
                    .CountAsync();

                return Ok(new OkunmamisSayisiDto { OkunmamisSayisi = okunmamisSayisi });
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
    public async Task<ActionResult<BildirimIslemSonucDto>> BildirimeOkunduIsaretle(long id)
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

                return Ok(new BildirimIslemSonucDto { Message = "Bildirim okundu olarak işaretlendi" });
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
    public async Task<ActionResult<BildirimIslemSonucDto>> TumunuOkunduIsaretle()
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                await _context.Bildirimler
                    .Where(b => b.AliciId == kullaniciId && !b.Okundu && !b.Silindi)
                    .ExecuteUpdateAsync(b => b.SetProperty(x => x.Okundu, true));

                return Ok(new BildirimIslemSonucDto { Message = "Tüm bildirimler okundu olarak işaretlendi" });
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
    public async Task<ActionResult<BildirimIslemSonucDto>> BildirimSil(long id)
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

                return Ok(new BildirimIslemSonucDto { Message = "Bildirim silindi" });
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
    public async Task<ActionResult<BildirimIslemSonucDto>> TumBildirimleriSil()
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                await _context.Bildirimler
                    .Where(b => b.AliciId == kullaniciId && !b.Silindi)
                    .ExecuteUpdateAsync(b => b.SetProperty(x => x.Silindi, true));

                return Ok(new BildirimIslemSonucDto { Message = "Tüm bildirimler silindi" });
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

        // DELETE: api/bildirim/duplicateleri-temizle - Veritabanındaki duplicate bildirimleri temizle
        [HttpDelete("duplicateleri-temizle")]
    public async Task<ActionResult<BildirimIslemSonucDto>> DuplicateBildirimleriTemizle()
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                // Aynı kullanıcıya, aynı gönderenden, aynı mesaj ve tipte olan bildirimleri bul
                var duplicateler = await _context.Bildirimler
                    .Where(b => b.AliciId == kullaniciId && !b.Silindi)
                    .GroupBy(b => new { b.GonderenId, b.Mesaj, b.Tip })
                    .Where(g => g.Count() > 1)
                    .SelectMany(g => g.OrderByDescending(b => b.OlusturulmaZamani).Skip(1)) // En yeni hariç hepsini al
                    .ToListAsync();

                if (duplicateler.Any())
                {
                    foreach (var bildirim in duplicateler)
                    {
                        bildirim.Silindi = true;
                    }
                    await _context.SaveChangesAsync();
                }

                return Ok(new BildirimIslemSonucDto { Message = $"{duplicateler.Count} duplicate bildirim temizlendi" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Yetkisiz erişim" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Duplicate bildirimler temizlenirken hata oluştu");
                return StatusCode(500, new { message = "Bildirimler temizlenirken bir hata oluştu" });
            }
        }

        // POST: api/bildirim/test (Development only - test bildirimi oluştur)
        [HttpPost("test")]
        [Authorize(Roles = "yonetici")]
    public async Task<ActionResult<BildirimIslemSonucDto>> TestBildirimiOlustur([FromBody] TestBildirimDto model)
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

                return Ok(new BildirimIslemSonucDto { Message = "Test bildirimi oluşturuldu" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Test bildirimi oluşturulurken hata oluştu");
                return StatusCode(500, new { message = "Bildirim oluşturulurken bir hata oluştu" });
            }
        }
    }
}
