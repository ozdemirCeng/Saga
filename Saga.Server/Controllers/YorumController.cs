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
    public class YorumController : ControllerBase
    {
        private readonly SagaDbContext _context;
        private readonly ILogger<YorumController> _logger;

        public YorumController(SagaDbContext context, ILogger<YorumController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // POST: api/yorum
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<YorumResponseDto>> CreateYorum([FromBody] YorumCreateDto dto)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var yorum = new Yorum
                {
                    KullaniciId = kullaniciId,
                    IcerikId = dto.IcerikId,
                    Baslik = dto.Baslik,
                    IcerikMetni = dto.Icerik,
                    Puan = dto.Puan,
                    SpoilerIceriyor = dto.SpoilerIceriyor,
                    OlusturulmaZamani = DateTime.UtcNow
                };

                _context.Yorumlar.Add(yorum);
                await _context.SaveChangesAsync();

                // Aktivite kaydı oluştur
                await CreateAktivite(kullaniciId, yorum.Id);

                var kullanici = await _context.Kullanicilar.FindAsync(kullaniciId);

                var response = new YorumResponseDto
                {
                    Id = yorum.Id,
                    IcerikId = yorum.IcerikId,
                    KullaniciId = yorum.KullaniciId,
                    KullaniciAdi = kullanici?.KullaniciAdi ?? "",
                    Baslik = yorum.Baslik,
                    Icerik = yorum.IcerikMetni,
                    Puan = yorum.Puan,
                    SpoilerIceriyor = yorum.SpoilerIceriyor,
                    BegeniSayisi = 0,
                    OlusturulmaZamani = yorum.OlusturulmaZamani,
                    GuncellemeZamani = yorum.GuncellemeZamani,
                    KullaniciBegendiMi = false
                };

                return CreatedAtAction(nameof(GetYorum), new { id = yorum.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Yorum oluşturulurken hata: {IcerikId}", dto.IcerikId);
                return StatusCode(500, new { message = "Yorum kaydedilirken bir hata oluştu." });
            }
        }

        // GET: api/yorum/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<YorumResponseDto>> GetYorum(long id)
        {
            var yorum = await _context.Yorumlar
                .Include(y => y.Kullanici)
                .Include(y => y.Begenenler)
                .AsNoTracking()
                .FirstOrDefaultAsync(y => y.Id == id && !y.Silindi);

            if (yorum == null)
            {
                return NotFound(new { message = "Yorum bulunamadı." });
            }

            var kullaniciId = GetCurrentUserIdOrNull();
            var kullanicininBegendigi = kullaniciId.HasValue &&
                yorum.Begenenler.Any(b => b.KullaniciId == kullaniciId.Value);

            var response = new YorumResponseDto
            {
                Id = yorum.Id,
                IcerikId = yorum.IcerikId,
                KullaniciId = yorum.KullaniciId,
                KullaniciAdi = yorum.Kullanici.KullaniciAdi,
                Baslik = yorum.Baslik,
                Icerik = yorum.IcerikMetni,
                Puan = yorum.Puan,
                SpoilerIceriyor = yorum.SpoilerIceriyor,
                BegeniSayisi = yorum.Begenenler.Count,
                OlusturulmaZamani = yorum.OlusturulmaZamani,
                GuncellemeZamani = yorum.GuncellemeZamani,
                KullaniciBegendiMi = kullanicininBegendigi
            };

            return Ok(response);
        }

        // PUT: api/yorum/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<YorumResponseDto>> UpdateYorum(long id, [FromBody] YorumUpdateDto dto)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var yorum = await _context.Yorumlar
                    .Include(y => y.Kullanici)
                    .Include(y => y.Begenenler)
                    .FirstOrDefaultAsync(y => y.Id == id && !y.Silindi);

                if (yorum == null)
                {
                    return NotFound(new { message = "Yorum bulunamadı." });
                }

                // Yetki kontrolü
                if (yorum.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                yorum.Baslik = dto.Baslik;
                yorum.IcerikMetni = dto.Icerik;
                yorum.Puan = dto.Puan;
                yorum.SpoilerIceriyor = dto.SpoilerIceriyor;
                yorum.GuncellemeZamani = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var response = new YorumResponseDto
                {
                    Id = yorum.Id,
                    IcerikId = yorum.IcerikId,
                    KullaniciId = yorum.KullaniciId,
                    KullaniciAdi = yorum.Kullanici.KullaniciAdi,
                    Baslik = yorum.Baslik,
                    Icerik = yorum.IcerikMetni,
                    Puan = yorum.Puan,
                    SpoilerIceriyor = yorum.SpoilerIceriyor,
                    BegeniSayisi = yorum.Begenenler.Count,
                    OlusturulmaZamani = yorum.OlusturulmaZamani,
                    GuncellemeZamani = yorum.GuncellemeZamani,
                    KullaniciBegendiMi = true
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Yorum güncellenirken hata: {Id}", id);
                return StatusCode(500, new { message = "Yorum güncellenirken bir hata oluştu." });
            }
        }

        // DELETE: api/yorum/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteYorum(long id)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var yorum = await _context.Yorumlar
                    .FirstOrDefaultAsync(y => y.Id == id);

                if (yorum == null)
                {
                    return NotFound(new { message = "Yorum bulunamadı." });
                }

                // Yetki kontrolü
                if (yorum.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                // Soft delete
                yorum.Silindi = true;
                yorum.GuncellemeZamani = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Yorum silinirken hata: {Id}", id);
                return StatusCode(500, new { message = "Yorum silinirken bir hata oluştu." });
            }
        }

        // GET: api/yorum/icerik/{icerikId}
        [HttpGet("icerik/{icerikId}")]
        public async Task<ActionResult<List<YorumListDto>>> GetIcerikYorumlari(
            long icerikId,
            [FromQuery] int sayfa = 1,
            [FromQuery] int sayfaBoyutu = 20)
        {
            var kullaniciId = GetCurrentUserIdOrNull();

            var query = _context.Yorumlar
                .Include(y => y.Kullanici)
                .Include(y => y.Begenenler)
                .Where(y => y.IcerikId == icerikId && !y.Silindi)
                .OrderByDescending(y => y.OlusturulmaZamani)
                .AsNoTracking();

            var toplam = await query.CountAsync();
            var yorumlar = await query
                .Skip((sayfa - 1) * sayfaBoyutu)
                .Take(sayfaBoyutu)
                .ToListAsync();

            var response = yorumlar.Select(y => new YorumListDto
            {
                Id = y.Id,
                KullaniciAdi = y.Kullanici.KullaniciAdi,
                Baslik = y.Baslik,
                IcerikOzet = y.IcerikMetni.Length > 150 ? y.IcerikMetni.Substring(0, 150) + "..." : y.IcerikMetni,
                Puan = y.Puan,
                SpoilerIceriyor = y.SpoilerIceriyor,
                BegeniSayisi = y.Begenenler.Count,
                OlusturulmaZamani = y.OlusturulmaZamani
            }).ToList();

            Response.Headers.Append("X-Toplam-Sayfa", ((toplam + sayfaBoyutu - 1) / sayfaBoyutu).ToString());
            Response.Headers.Append("X-Toplam-Kayit", toplam.ToString());

            return Ok(response);
        }

        // POST: api/yorum/{id}/begeni
        [HttpPost("{id}/begeni")]
        [Authorize]
        public async Task<IActionResult> ToggleBegeni(long id)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var yorum = await _context.Yorumlar
                    .Include(y => y.Begenenler)
                    .FirstOrDefaultAsync(y => y.Id == id && !y.Silindi);

                if (yorum == null)
                {
                    return NotFound(new { message = "Yorum bulunamadı." });
                }

                var mevcutBegeni = yorum.Begenenler
                    .FirstOrDefault(b => b.KullaniciId == kullaniciId);

                if (mevcutBegeni != null)
                {
                    // Beğeniyi kaldır
                    _context.YorumBegenileri.Remove(mevcutBegeni);
                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Beğeni kaldırıldı", begendi = false, begeniSayisi = yorum.Begenenler.Count - 1 });
                }
                else
                {
                    // Beğeni ekle
                    var begeni = new YorumBegeni
                    {
                        YorumId = id,
                        KullaniciId = kullaniciId,
                        OlusturulmaZamani = DateTime.UtcNow
                    };
                    _context.YorumBegenileri.Add(begeni);
                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Yorum beğenildi", begendi = true, begeniSayisi = yorum.Begenenler.Count + 1 });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Beğeni işlenirken hata: {YorumId}", id);
                return StatusCode(500, new { message = "Beğeni işlenirken bir hata oluştu." });
            }
        }

        // Helper Methods
        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Kullanıcı kimliği doğrulanamadı.");
        }

        private Guid? GetCurrentUserIdOrNull()
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return null;
        }

        private async Task CreateAktivite(Guid kullaniciId, long yorumId)
        {
            var aktivite = new Aktivite
            {
                KullaniciId = kullaniciId,
                AktiviteTuru = AktiviteTuru.yorum,
                YorumId = yorumId,
                OlusturulmaZamani = DateTime.UtcNow
            };

            _context.Aktiviteler.Add(aktivite);
            await _context.SaveChangesAsync();
        }
    }
}
