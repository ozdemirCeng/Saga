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
    public class PuanlamaController : ControllerBase
    {
        private readonly SagaDbContext _context;
        private readonly ILogger<PuanlamaController> _logger;

        public PuanlamaController(SagaDbContext context, ILogger<PuanlamaController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // POST: api/puanlama
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<PuanlamaResponseDto>> CreatePuanlama([FromBody] PuanlamaCreateDto dto)
        {
            try
            {
                // Kullanıcı ID'sini JWT'den al (şimdilik placeholder)
                var kullaniciId = GetCurrentUserId();

                // Aynı içerik için daha önce puanlama var mı kontrol et
                var mevcutPuanlama = await _context.Puanlamalar
                    .FirstOrDefaultAsync(p => p.KullaniciId == kullaniciId && p.IcerikId == dto.IcerikId);

                if (mevcutPuanlama != null)
                {
                    return Conflict(new { message = "Bu içerik için zaten bir puanlama yaptınız. Güncelleme için PUT endpoint'ini kullanın." });
                }

                var puanlama = new Puanlama
                {
                    KullaniciId = kullaniciId,
                    IcerikId = dto.IcerikId,
                    Puan = dto.Puan,
                    OlusturulmaZamani = DateTime.UtcNow,
                    GuncellemeZamani = DateTime.UtcNow
                };

                _context.Puanlamalar.Add(puanlama);
                await _context.SaveChangesAsync();

                // Aktivite kaydı oluştur
                await CreateAktivite(kullaniciId, puanlama.Id);

                var response = new PuanlamaResponseDto
                {
                    Id = puanlama.Id,
                    IcerikId = puanlama.IcerikId,
                    KullaniciId = puanlama.KullaniciId,
                    KullaniciAdi = "", // TODO: Join ile doldurulacak
                    IcerikBaslik = "", // TODO: Join ile doldurulacak
                    Puan = puanlama.Puan,
                    OlusturulmaZamani = puanlama.OlusturulmaZamani,
                    GuncellemeZamani = puanlama.GuncellemeZamani
                };

                return CreatedAtAction(nameof(GetPuanlama), new { id = puanlama.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Puanlama oluşturulurken hata: {IcerikId}", dto.IcerikId);
                return StatusCode(500, new { message = "Puanlama kaydedilirken bir hata oluştu." });
            }
        }

        // GET: api/puanlama/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PuanlamaResponseDto>> GetPuanlama(long id)
        {
            var puanlama = await _context.Puanlamalar
                .Include(p => p.Kullanici)
                .Include(p => p.Icerik)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);

            if (puanlama == null)
            {
                return NotFound(new { message = "Puanlama bulunamadı." });
            }

            var response = new PuanlamaResponseDto
            {
                Id = puanlama.Id,
                IcerikId = puanlama.IcerikId,
                KullaniciId = puanlama.KullaniciId,
                KullaniciAdi = puanlama.Kullanici.KullaniciAdi,
                IcerikBaslik = puanlama.Icerik.Baslik,
                Puan = puanlama.Puan,
                OlusturulmaZamani = puanlama.OlusturulmaZamani,
                GuncellemeZamani = puanlama.GuncellemeZamani
            };

            return Ok(response);
        }

        // PUT: api/puanlama/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<PuanlamaResponseDto>> UpdatePuanlama(long id, [FromBody] PuanlamaUpdateDto dto)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var puanlama = await _context.Puanlamalar
                    .Include(p => p.Kullanici)
                    .Include(p => p.Icerik)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (puanlama == null)
                {
                    return NotFound(new { message = "Puanlama bulunamadı." });
                }

                // Yetki kontrolü: sadece kendi puanlamasını güncelleyebilir
                if (puanlama.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                puanlama.Puan = dto.Puan;
                puanlama.GuncellemeZamani = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var response = new PuanlamaResponseDto
                {
                    Id = puanlama.Id,
                    IcerikId = puanlama.IcerikId,
                    KullaniciId = puanlama.KullaniciId,
                    KullaniciAdi = puanlama.Kullanici.KullaniciAdi,
                    IcerikBaslik = puanlama.Icerik.Baslik,
                    Puan = puanlama.Puan,
                    OlusturulmaZamani = puanlama.OlusturulmaZamani,
                    GuncellemeZamani = puanlama.GuncellemeZamani
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Puanlama güncellenirken hata: {Id}", id);
                return StatusCode(500, new { message = "Puanlama güncellenirken bir hata oluştu." });
            }
        }

        // DELETE: api/puanlama/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeletePuanlama(long id)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var puanlama = await _context.Puanlamalar
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (puanlama == null)
                {
                    return NotFound(new { message = "Puanlama bulunamadı." });
                }

                // Yetki kontrolü
                if (puanlama.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                _context.Puanlamalar.Remove(puanlama);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Puanlama silinirken hata: {Id}", id);
                return StatusCode(500, new { message = "Puanlama silinirken bir hata oluştu." });
            }
        }

        // GET: api/puanlama/icerik/{icerikId}/istatistik
        [HttpGet("icerik/{icerikId}/istatistik")]
        public async Task<ActionResult<PuanlamaIstatistikDto>> GetIcerikIstatistik(long icerikId)
        {
            var puanlamalar = await _context.Puanlamalar
                .AsNoTracking()
                .Where(p => p.IcerikId == icerikId && !p.Silindi)
                .ToListAsync();

            if (!puanlamalar.Any())
            {
                return Ok(new PuanlamaIstatistikDto
                {
                    IcerikId = icerikId,
                    ToplamPuanlama = 0,
                    OrtalamaPuan = 0,
                    Puan1Sayisi = 0,
                    Puan2Sayisi = 0,
                    Puan3Sayisi = 0,
                    Puan4Sayisi = 0,
                    Puan5Sayisi = 0,
                    Puan6Sayisi = 0,
                    Puan7Sayisi = 0,
                    Puan8Sayisi = 0,
                    Puan9Sayisi = 0,
                    Puan10Sayisi = 0
                });
            }

            var gruplar = puanlamalar
                .GroupBy(p => (int)Math.Floor(p.Puan))
                .ToDictionary(g => g.Key, g => g.Count());

            var istatistik = new PuanlamaIstatistikDto
            {
                IcerikId = icerikId,
                ToplamPuanlama = puanlamalar.Count,
                OrtalamaPuan = (decimal)puanlamalar.Average(p => p.Puan),
                Puan1Sayisi = gruplar.GetValueOrDefault(1, 0),
                Puan2Sayisi = gruplar.GetValueOrDefault(2, 0),
                Puan3Sayisi = gruplar.GetValueOrDefault(3, 0),
                Puan4Sayisi = gruplar.GetValueOrDefault(4, 0),
                Puan5Sayisi = gruplar.GetValueOrDefault(5, 0),
                Puan6Sayisi = gruplar.GetValueOrDefault(6, 0),
                Puan7Sayisi = gruplar.GetValueOrDefault(7, 0),
                Puan8Sayisi = gruplar.GetValueOrDefault(8, 0),
                Puan9Sayisi = gruplar.GetValueOrDefault(9, 0),
                Puan10Sayisi = gruplar.GetValueOrDefault(10, 0)
            };

            return Ok(istatistik);
        }

        // GET: api/puanlama/icerik/{icerikId}/benim
        // Proje İsterler 2.1.4: Kullanıcının bu içerik için verdiği puanı getir
        [HttpGet("icerik/{icerikId}/benim")]
        [Authorize]
        public async Task<ActionResult<PuanlamaResponseDto>> GetKullaniciIcerikPuani(long icerikId)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var puanlama = await _context.Puanlamalar
                    .Include(p => p.Kullanici)
                    .Include(p => p.Icerik)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.KullaniciId == kullaniciId && p.IcerikId == icerikId && !p.Silindi);

                if (puanlama == null)
                {
                    return NotFound(new { message = "Bu içerik için henüz puanlama yapmadınız." });
                }

                var response = new PuanlamaResponseDto
                {
                    Id = puanlama.Id,
                    IcerikId = puanlama.IcerikId,
                    KullaniciId = puanlama.KullaniciId,
                    KullaniciAdi = puanlama.Kullanici.KullaniciAdi,
                    IcerikBaslik = puanlama.Icerik.Baslik,
                    Puan = puanlama.Puan,
                    OlusturulmaZamani = puanlama.OlusturulmaZamani,
                    GuncellemeZamani = puanlama.GuncellemeZamani
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kullanıcı puanlaması getirilemedi: {IcerikId}", icerikId);
                return StatusCode(500, new { message = "Puanlama getirilemedi." });
            }
        }

        // GET: api/puanlama/kullanici/{kullaniciId}
        [HttpGet("kullanici/{kullaniciId}")]
        public async Task<ActionResult<List<PuanlamaResponseDto>>> GetKullaniciPuanlamalari(Guid kullaniciId)
        {
            var puanlamalar = await _context.Puanlamalar
                .Include(p => p.Kullanici)
                .Include(p => p.Icerik)
                .AsNoTracking()
                .Where(p => p.KullaniciId == kullaniciId && !p.Silindi)
                .OrderByDescending(p => p.GuncellemeZamani ?? p.OlusturulmaZamani)
                .Take(100)
                .ToListAsync();

            var response = puanlamalar.Select(p => new PuanlamaResponseDto
            {
                Id = p.Id,
                IcerikId = p.IcerikId,
                KullaniciId = p.KullaniciId,
                KullaniciAdi = p.Kullanici.KullaniciAdi,
                IcerikBaslik = p.Icerik.Baslik,
                Puan = p.Puan,
                OlusturulmaZamani = p.OlusturulmaZamani,
                GuncellemeZamani = p.GuncellemeZamani
            }).ToList();

            return Ok(response);
        }

        // Helper Methods
        private Guid GetCurrentUserId()
        {
            // TODO: JWT token'dan kullanıcı ID'sini çek
            // Şimdilik test için placeholder GUID
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Kullanıcı kimliği doğrulanamadı.");
        }

        private async Task CreateAktivite(Guid kullaniciId, long puanlamaId)
        {
            var aktivite = new Aktivite
            {
                KullaniciId = kullaniciId,
                AktiviteTuru = AktiviteTuru.puanlama,
                PuanlamaId = puanlamaId,
                OlusturulmaZamani = DateTime.UtcNow
            };

            _context.Aktiviteler.Add(aktivite);
            await _context.SaveChangesAsync();
        }
    }
}
