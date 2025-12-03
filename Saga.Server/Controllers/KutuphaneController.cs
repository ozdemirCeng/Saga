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
    public class KutuphaneController : BaseApiController
    {
        private readonly SagaDbContext _context;
        private readonly ILogger<KutuphaneController> _logger;

        public KutuphaneController(SagaDbContext context, ILogger<KutuphaneController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // POST: api/kutuphane
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<KutuphaneDurumDto>> CreateKutuphaneDurum([FromBody] KutuphaneDurumCreateDto dto)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                // Durum string'den enum'a çevir
                if (!Enum.TryParse<KutuphaneDurum>(dto.Durum, true, out var durum))
                {
                    return BadRequest(new { message = "Geçersiz durum. 'izlendi', 'izlenecek', 'okundu', 'okunacak' veya 'devam_ediyor' olmalıdır." });
                }

                // Aynı içerik için zaten durum var mı?
                var mevcutDurum = await _context.KutuphaneDurumlari
                    .FirstOrDefaultAsync(k => k.KullaniciId == kullaniciId && k.IcerikId == dto.IcerikId && !k.Silindi);

                if (mevcutDurum != null)
                {
                    return Conflict(new { message = "Bu içerik için zaten bir kütüphane durumu var. Güncelleme için PUT endpoint'ini kullanın." });
                }

                var kutuphaneDurum = new KutuphaneDurumu
                {
                    KullaniciId = kullaniciId,
                    IcerikId = dto.IcerikId,
                    Durum = durum,
                    Ilerleme = dto.Ilerleme,
                    BaslangicTarihi = dto.BaslangicTarihi,
                    BitisTarihi = dto.BitisTarihi,
                    OlusturulmaZamani = DateTime.UtcNow,
                    GuncellemeZamani = DateTime.UtcNow
                };

                _context.KutuphaneDurumlari.Add(kutuphaneDurum);
                await _context.SaveChangesAsync();

                    // TODO: Kütüphane durum güncelleme aktiviteleri için DB tarafında trigger tanımlandığında C# tarafında manuel Aktivite oluşturma kaldırıldı.
                    // Şu anda sadece kutuphane_durumlari tablosu güncelleniyor; feed ihtiyacı artarsa veritabaniyapisi'ne uygun bir trigger eklenmeli.

                var icerik = await _context.Icerikler.FindAsync(dto.IcerikId);

                var response = new KutuphaneDurumDto
                {
                    Id = kutuphaneDurum.Id,
                    KullaniciId = kutuphaneDurum.KullaniciId,
                    IcerikId = kutuphaneDurum.IcerikId,
                    IcerikBaslik = icerik?.Baslik ?? "",
                    IcerikTur = icerik?.Tur.ToString() ?? "",
                    PosterUrl = icerik?.PosterUrl,
                    Durum = kutuphaneDurum.Durum.ToString(),
                    Ilerleme = kutuphaneDurum.Ilerleme,
                    BaslangicTarihi = kutuphaneDurum.BaslangicTarihi,
                    BitisTarihi = kutuphaneDurum.BitisTarihi,
                    OlusturulmaZamani = kutuphaneDurum.OlusturulmaZamani,
                    GuncellemeZamani = kutuphaneDurum.GuncellemeZamani
                };

                return CreatedAtAction(nameof(GetKutuphaneDurum), new { id = kutuphaneDurum.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kütüphane durumu oluşturulurken hata: {IcerikId}", dto.IcerikId);
                return StatusCode(500, new { message = "Kütüphane durumu kaydedilirken bir hata oluştu." });
            }
        }

        // GET: api/kutuphane/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<KutuphaneDurumDto>> GetKutuphaneDurum(long id)
        {
            var kutuphaneDurum = await _context.KutuphaneDurumlari
                .Include(k => k.Icerik)
                .AsNoTracking()
                .FirstOrDefaultAsync(k => k.Id == id && !k.Silindi);

            if (kutuphaneDurum == null)
            {
                return NotFound(new { message = "Kütüphane durumu bulunamadı." });
            }

            var response = new KutuphaneDurumDto
            {
                Id = kutuphaneDurum.Id,
                KullaniciId = kutuphaneDurum.KullaniciId,
                IcerikId = kutuphaneDurum.IcerikId,
                IcerikBaslik = kutuphaneDurum.Icerik.Baslik,
                IcerikTur = kutuphaneDurum.Icerik.Tur.ToString(),
                PosterUrl = kutuphaneDurum.Icerik.PosterUrl,
                Durum = kutuphaneDurum.Durum.ToString(),
                Ilerleme = kutuphaneDurum.Ilerleme,
                BaslangicTarihi = kutuphaneDurum.BaslangicTarihi,
                BitisTarihi = kutuphaneDurum.BitisTarihi,
                OlusturulmaZamani = kutuphaneDurum.OlusturulmaZamani,
                GuncellemeZamani = kutuphaneDurum.GuncellemeZamani
            };

            return Ok(response);
        }

        // PUT: api/kutuphane/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<KutuphaneDurumDto>> UpdateKutuphaneDurum(long id, [FromBody] KutuphaneDurumUpdateDto dto)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                // Durum string'den enum'a çevir
                if (!Enum.TryParse<KutuphaneDurum>(dto.Durum, true, out var durum))
                {
                    return BadRequest(new { message = "Geçersiz durum." });
                }

                var kutuphaneDurum = await _context.KutuphaneDurumlari
                    .Include(k => k.Icerik)
                    .FirstOrDefaultAsync(k => k.Id == id && !k.Silindi);

                if (kutuphaneDurum == null)
                {
                    return NotFound(new { message = "Kütüphane durumu bulunamadı." });
                }

                // Yetki kontrolü
                if (kutuphaneDurum.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                kutuphaneDurum.Durum = durum;
                kutuphaneDurum.Ilerleme = dto.Ilerleme;
                kutuphaneDurum.BaslangicTarihi = dto.BaslangicTarihi;
                kutuphaneDurum.BitisTarihi = dto.BitisTarihi;
                kutuphaneDurum.GuncellemeZamani = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // NOT: Aktivite kaydı artık veritabanı trigger'ları tarafından yapılıyor.
                // Çifte kayıt sorununu önlemek için CreateAktivite çağrısı kaldırıldı.

                var response = new KutuphaneDurumDto
                {
                    Id = kutuphaneDurum.Id,
                    KullaniciId = kutuphaneDurum.KullaniciId,
                    IcerikId = kutuphaneDurum.IcerikId,
                    IcerikBaslik = kutuphaneDurum.Icerik.Baslik,
                    IcerikTur = kutuphaneDurum.Icerik.Tur.ToString(),
                    PosterUrl = kutuphaneDurum.Icerik.PosterUrl,
                    Durum = kutuphaneDurum.Durum.ToString(),
                    Ilerleme = kutuphaneDurum.Ilerleme,
                    BaslangicTarihi = kutuphaneDurum.BaslangicTarihi,
                    BitisTarihi = kutuphaneDurum.BitisTarihi,
                    OlusturulmaZamani = kutuphaneDurum.OlusturulmaZamani,
                    GuncellemeZamani = kutuphaneDurum.GuncellemeZamani
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kütüphane durumu güncellenirken hata: {Id}", id);
                return StatusCode(500, new { message = "Güncelleme sırasında bir hata oluştu." });
            }
        }

        // DELETE: api/kutuphane/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteKutuphaneDurum(long id)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var kutuphaneDurum = await _context.KutuphaneDurumlari
                    .FirstOrDefaultAsync(k => k.Id == id);

                if (kutuphaneDurum == null)
                {
                    return NotFound(new { message = "Kütüphane durumu bulunamadı." });
                }

                // Yetki kontrolü
                if (kutuphaneDurum.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                // Soft delete
                kutuphaneDurum.Silindi = true;
                kutuphaneDurum.GuncellemeZamani = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kütüphane durumu silinirken hata: {Id}", id);
                return StatusCode(500, new { message = "Silme sırasında bir hata oluştu." });
            }
        }

        // DELETE: api/kutuphane/icerik/{icerikId}
        // Frontend için icerikId ile kütüphaneden kaldırma
        [HttpDelete("icerik/{icerikId}")]
        [Authorize]
        public async Task<IActionResult> DeleteKutuphaneDurumByIcerikId(long icerikId)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var kutuphaneDurum = await _context.KutuphaneDurumlari
                    .FirstOrDefaultAsync(k => k.KullaniciId == kullaniciId && k.IcerikId == icerikId && !k.Silindi);

                if (kutuphaneDurum == null)
                {
                    return NotFound(new { message = "Bu içerik için kütüphane durumu bulunamadı." });
                }

                // Soft delete
                kutuphaneDurum.Silindi = true;
                kutuphaneDurum.GuncellemeZamani = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kütüphane durumu silinirken hata (icerikId): {IcerikId}", icerikId);
                return StatusCode(500, new { message = "Silme sırasında bir hata oluştu." });
            }
        }

        // GET: api/kutuphane/kullanici/{kullaniciId}
        [HttpGet("kullanici/{kullaniciId}")]
        public async Task<ActionResult<List<KutuphaneListDto>>> GetKullaniciKutuphanesi(
            Guid kullaniciId,
            [FromQuery] string? durum = null,
            [FromQuery] string? tur = null)
        {
            var query = _context.KutuphaneDurumlari
                .Include(k => k.Icerik)
                .Where(k => k.KullaniciId == kullaniciId && !k.Silindi)
                .AsNoTracking();

            // Durum filtresi
            if (!string.IsNullOrEmpty(durum) && Enum.TryParse<KutuphaneDurum>(durum, true, out var durumEnum))
            {
                query = query.Where(k => k.Durum == durumEnum);
            }

            // Tür filtresi (film/kitap)
            if (!string.IsNullOrEmpty(tur) && Enum.TryParse<IcerikTuru>(tur, true, out var turEnum))
            {
                query = query.Where(k => k.Icerik.Tur == turEnum);
            }

            var kutuphaneDurumlari = await query
                .OrderByDescending(k => k.GuncellemeZamani)
                .ToListAsync();

            var response = kutuphaneDurumlari.Select(k => new KutuphaneListDto
            {
                IcerikId = k.IcerikId,
                Baslik = k.Icerik.Baslik,
                Tur = k.Icerik.Tur.ToString(),
                PosterUrl = k.Icerik.PosterUrl,
                OrtalamaPuan = k.Icerik.OrtalamaPuan,
                Durum = k.Durum.ToString(),
                Ilerleme = k.Ilerleme,
                GuncellemeZamani = k.GuncellemeZamani
            }).ToList();

            return Ok(response);
        }

        // GET: api/kutuphane/icerik/{icerikId}
        // Frontend service için authenticated user'ın bu içerik için kütüphane durumunu getir
        [HttpGet("icerik/{icerikId}")]
        [Authorize]
        public async Task<ActionResult<KutuphaneDurumDto>> GetKullaniciIcerikDurumu(long icerikId)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var kutuphaneDurum = await _context.KutuphaneDurumlari
                    .Include(k => k.Icerik)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(k => k.KullaniciId == kullaniciId && k.IcerikId == icerikId && !k.Silindi);

                if (kutuphaneDurum == null)
                {
                    return NotFound(new { message = "Bu içerik için kütüphane durumu bulunamadı." });
                }

                var response = new KutuphaneDurumDto
                {
                    Id = kutuphaneDurum.Id,
                    KullaniciId = kutuphaneDurum.KullaniciId,
                    IcerikId = kutuphaneDurum.IcerikId,
                    IcerikBaslik = kutuphaneDurum.Icerik.Baslik,
                    IcerikTur = kutuphaneDurum.Icerik.Tur.ToString(),
                    PosterUrl = kutuphaneDurum.Icerik.PosterUrl,
                    Durum = kutuphaneDurum.Durum.ToString(),
                    Ilerleme = kutuphaneDurum.Ilerleme,
                    BaslangicTarihi = kutuphaneDurum.BaslangicTarihi,
                    BitisTarihi = kutuphaneDurum.BitisTarihi,
                    OlusturulmaZamani = kutuphaneDurum.OlusturulmaZamani,
                    GuncellemeZamani = kutuphaneDurum.GuncellemeZamani
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kullanıcı kütüphane durumu getirilemedi: {IcerikId}", icerikId);
                return StatusCode(500, new { message = "Kütüphane durumu getirilemedi." });
            }
        }

        // GET: api/kutuphane/kullanici/{kullaniciId}/istatistik
        [HttpGet("kullanici/{kullaniciId}/istatistik")]
        public async Task<ActionResult<KutuphaneIstatistikDto>> GetKullaniciIstatistik(Guid kullaniciId)
        {
            var kutuphaneDurumlari = await _context.KutuphaneDurumlari
                .Include(k => k.Icerik)
                .Where(k => k.KullaniciId == kullaniciId && !k.Silindi)
                .AsNoTracking()
                .ToListAsync();

            var filmler = kutuphaneDurumlari.Where(k => k.Icerik.Tur == IcerikTuru.film).ToList();
            var kitaplar = kutuphaneDurumlari.Where(k => k.Icerik.Tur == IcerikTuru.kitap).ToList();

            var istatistik = new KutuphaneIstatistikDto
            {
                KullaniciId = kullaniciId,
                ToplamFilm = filmler.Count,
                IzlenenFilm = filmler.Count(f => f.Durum == KutuphaneDurum.izlendi),
                IzlenecekFilm = filmler.Count(f => f.Durum == KutuphaneDurum.izlenecek),
                DevamEdenFilm = filmler.Count(f => f.Durum == KutuphaneDurum.devam_ediyor),
                ToplamKitap = kitaplar.Count,
                OkunanKitap = kitaplar.Count(k => k.Durum == KutuphaneDurum.okundu),
                OkunacakKitap = kitaplar.Count(k => k.Durum == KutuphaneDurum.okunacak),
                DevamEdenKitap = kitaplar.Count(k => k.Durum == KutuphaneDurum.devam_ediyor)
            };

            return Ok(istatistik);
        }

        // Helper Methods BaseApiController'dan gelmektedir.
        // CreateAktivite metodu kaldırıldı - veritabanı trigger'ları aktivite kaydını otomatik yapıyor.
    }
}
