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
    public class IcerikController : ControllerBase
    {
        private readonly SagaDbContext _context;
        private readonly ILogger<IcerikController> _logger;

        public IcerikController(SagaDbContext context, ILogger<IcerikController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/icerik/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<IcerikDetailDto>> GetIcerik(long id)
        {
            var icerik = await _context.Icerikler
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == id);

            if (icerik == null)
            {
                return NotFound(new { message = "İçerik bulunamadı." });
            }

            var kullaniciId = GetCurrentUserIdOrNull();

            // İstatistikleri al
            var yorumSayisi = await _context.Yorumlar.CountAsync(y => y.IcerikId == id && !y.Silindi);
            var listeyeEklenmeSayisi = await _context.ListeIcerikleri.CountAsync(li => li.IcerikId == id);

            // Kullanıcının puanı ve durumu
            decimal? kullaniciPuani = null;
            string? kullanicininDurumu = null;

            if (kullaniciId.HasValue)
            {
                var puanlama = await _context.Puanlamalar
                    .FirstOrDefaultAsync(p => p.KullaniciId == kullaniciId.Value && p.IcerikId == id && !p.Silindi);
                kullaniciPuani = puanlama?.Puan;

                var kutuphaneDurum = await _context.KutuphaneDurumlari
                    .FirstOrDefaultAsync(k => k.KullaniciId == kullaniciId.Value && k.IcerikId == id && !k.Silindi);
                kullanicininDurumu = kutuphaneDurum?.Durum.ToString();

                // Görüntüleme sayısını artır
                icerik.GoruntulemeSayisi++;
                await _context.SaveChangesAsync();
            }

            var response = new IcerikDetailDto
            {
                Id = icerik.Id,
                HariciId = icerik.HariciId,
                ApiKaynagi = icerik.ApiKaynagi.ToString(),
                Tur = icerik.Tur.ToString(),
                Baslik = icerik.Baslik,
                Aciklama = icerik.Aciklama,
                PosterUrl = icerik.PosterUrl,
                YayinTarihi = icerik.YayinTarihi,
                OrtalamaPuan = icerik.OrtalamaPuan,
                PuanlamaSayisi = icerik.PuanlamaSayisi,
                YorumSayisi = yorumSayisi,
                ListeyeEklenmeSayisi = listeyeEklenmeSayisi,
                GoruntulemeSayisi = icerik.GoruntulemeSayisi,
                PopulerlikSkoru = icerik.PopulerlikSkoru,
                OlusturulmaZamani = icerik.OlusturulmaZamani,
                KullaniciPuani = kullaniciPuani,
                KullanicininDurumu = kullanicininDurumu
            };

            return Ok(response);
        }

        // GET: api/icerik/ara?q={query}
        [HttpGet("ara")]
        public async Task<ActionResult<List<IcerikSearchDto>>> SearchIcerik(
            [FromQuery] string q,
            [FromQuery] string? tur = null,
            [FromQuery] int sayfa = 1,
            [FromQuery] int limit = 20)
        {
            if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            {
                return BadRequest(new { message = "Arama terimi en az 2 karakter olmalıdır." });
            }

            var query = _context.Icerikler
                .Where(i => i.Baslik.Contains(q) || (i.Aciklama != null && i.Aciklama.Contains(q)))
                .AsNoTracking();

            // Tür filtresi
            if (!string.IsNullOrEmpty(tur) && Enum.TryParse<IcerikTuru>(tur, true, out var turEnum))
            {
                query = query.Where(i => i.Tur == turEnum);
            }

            var toplam = await query.CountAsync();
            var icerikler = await query
                .OrderByDescending(i => i.PopulerlikSkoru)
                .Skip((sayfa - 1) * limit)
                .Take(limit)
                .ToListAsync();

            var response = icerikler.Select(i => new IcerikSearchDto
            {
                Id = i.Id,
                Baslik = i.Baslik,
                Tur = i.Tur.ToString(),
                PosterUrl = i.PosterUrl,
                OrtalamaPuan = i.OrtalamaPuan,
                YayinTarihi = i.YayinTarihi,
                Aciklama = i.Aciklama != null && i.Aciklama.Length > 200
                    ? i.Aciklama.Substring(0, 200) + "..."
                    : i.Aciklama
            }).ToList();

            Response.Headers.Append("X-Toplam-Sayfa", ((toplam + limit - 1) / limit).ToString());
            Response.Headers.Append("X-Toplam-Kayit", toplam.ToString());

            return Ok(response);
        }

        // GET: api/icerik/populer
        [HttpGet("populer")]
        public async Task<ActionResult<List<IcerikListDto>>> GetPopulerIcerikler(
            [FromQuery] string? tur = null,
            [FromQuery] int limit = 20)
        {
            var query = _context.Icerikler.AsNoTracking();

            // Tür filtresi
            if (!string.IsNullOrEmpty(tur) && Enum.TryParse<IcerikTuru>(tur, true, out var turEnum))
            {
                query = query.Where(i => i.Tur == turEnum);
            }

            var icerikler = await query
                .OrderByDescending(i => i.PopulerlikSkoru)
                .Take(limit)
                .ToListAsync();

            var response = icerikler.Select(i => new IcerikListDto
            {
                Id = i.Id,
                Baslik = i.Baslik,
                Tur = i.Tur.ToString(),
                PosterUrl = i.PosterUrl,
                OrtalamaPuan = i.OrtalamaPuan,
                PuanlamaSayisi = i.PuanlamaSayisi,
                PopulerlikSkoru = i.PopulerlikSkoru,
                YayinTarihi = i.YayinTarihi
            }).ToList();

            return Ok(response);
        }

        // GET: api/icerik/yeni
        [HttpGet("yeni")]
        public async Task<ActionResult<List<IcerikListDto>>> GetYeniIcerikler(
            [FromQuery] string? tur = null,
            [FromQuery] int limit = 20)
        {
            var query = _context.Icerikler.AsNoTracking();

            // Tür filtresi
            if (!string.IsNullOrEmpty(tur) && Enum.TryParse<IcerikTuru>(tur, true, out var turEnum))
            {
                query = query.Where(i => i.Tur == turEnum);
            }

            var icerikler = await query
                .OrderByDescending(i => i.YayinTarihi ?? DateOnly.MinValue)
                .ThenByDescending(i => i.OlusturulmaZamani)
                .Take(limit)
                .ToListAsync();

            var response = icerikler.Select(i => new IcerikListDto
            {
                Id = i.Id,
                Baslik = i.Baslik,
                Tur = i.Tur.ToString(),
                PosterUrl = i.PosterUrl,
                OrtalamaPuan = i.OrtalamaPuan,
                PuanlamaSayisi = i.PuanlamaSayisi,
                PopulerlikSkoru = i.PopulerlikSkoru,
                YayinTarihi = i.YayinTarihi
            }).ToList();

            return Ok(response);
        }

        // GET: api/icerik/en-yuksek-puan
        [HttpGet("en-yuksek-puan")]
        public async Task<ActionResult<List<IcerikListDto>>> GetEnYuksekPuanlilar(
            [FromQuery] string? tur = null,
            [FromQuery] int minPuanlamaSayisi = 10,
            [FromQuery] int limit = 20)
        {
            var query = _context.Icerikler
                .Where(i => i.PuanlamaSayisi >= minPuanlamaSayisi)
                .AsNoTracking();

            // Tür filtresi
            if (!string.IsNullOrEmpty(tur) && Enum.TryParse<IcerikTuru>(tur, true, out var turEnum))
            {
                query = query.Where(i => i.Tur == turEnum);
            }

            var icerikler = await query
                .OrderByDescending(i => i.OrtalamaPuan)
                .ThenByDescending(i => i.PuanlamaSayisi)
                .Take(limit)
                .ToListAsync();

            var response = icerikler.Select(i => new IcerikListDto
            {
                Id = i.Id,
                Baslik = i.Baslik,
                Tur = i.Tur.ToString(),
                PosterUrl = i.PosterUrl,
                OrtalamaPuan = i.OrtalamaPuan,
                PuanlamaSayisi = i.PuanlamaSayisi,
                PopulerlikSkoru = i.PopulerlikSkoru,
                YayinTarihi = i.YayinTarihi
            }).ToList();

            return Ok(response);
        }

        // GET: api/icerik/onerilenler
        [HttpGet("onerilenler")]
        [Authorize]
        public async Task<ActionResult<List<IcerikListDto>>> GetOnerilenler([FromQuery] int limit = 20)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                // Kullanıcının puanladığı içeriklerin türlerini al
                var kullaniciPuanlamalari = await _context.Puanlamalar
                    .Include(p => p.Icerik)
                    .Where(p => p.KullaniciId == kullaniciId && !p.Silindi)
                    .AsNoTracking()
                    .ToListAsync();

                if (!kullaniciPuanlamalari.Any())
                {
                    // Puanlama yoksa, popüler içerikleri döndür
                    return await GetPopulerIcerikler(null, limit);
                }

                // Kullanıcının ortalama puanından yüksek verdiği içerikler
                var ortPuan = kullaniciPuanlamalari.Average(p => p.Puan);
                var begenilenTurler = kullaniciPuanlamalari
                    .Where(p => p.Puan >= ortPuan)
                    .Select(p => p.Icerik.Tur)
                    .Distinct()
                    .ToList();

                // Kullanıcının zaten puanladığı içerik ID'leri
                var puanlananIcerikIds = kullaniciPuanlamalari.Select(p => p.IcerikId).ToList();

                // Beğenilen türlerden, henüz puanlanmamış, yüksek puanlı içerikler
                var oneriler = await _context.Icerikler
                    .Where(i => begenilenTurler.Contains(i.Tur) &&
                                !puanlananIcerikIds.Contains(i.Id) &&
                                i.PuanlamaSayisi >= 5 &&
                                i.OrtalamaPuan >= 7.0m)
                    .OrderByDescending(i => i.PopulerlikSkoru)
                    .Take(limit)
                    .AsNoTracking()
                    .ToListAsync();

                var response = oneriler.Select(i => new IcerikListDto
                {
                    Id = i.Id,
                    Baslik = i.Baslik,
                    Tur = i.Tur.ToString(),
                    PosterUrl = i.PosterUrl,
                    OrtalamaPuan = i.OrtalamaPuan,
                    PuanlamaSayisi = i.PuanlamaSayisi,
                    PopulerlikSkoru = i.PopulerlikSkoru,
                    YayinTarihi = i.YayinTarihi
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Öneri sistemi hatası");
                return StatusCode(500, new { message = "Öneriler yüklenirken bir hata oluştu." });
            }
        }

        // GET: api/icerik/filtrele
        [HttpGet("filtrele")]
        public async Task<ActionResult<List<IcerikListDto>>> FiltrelemeIle(
            [FromQuery] string? tur = null,
            [FromQuery] string? siralama = "populerlik",
            [FromQuery] decimal? minPuan = null,
            [FromQuery] int? minYil = null,
            [FromQuery] int? maxYil = null,
            [FromQuery] int sayfa = 1,
            [FromQuery] int limit = 20)
        {
            var query = _context.Icerikler.AsNoTracking();

            // Tür filtresi
            if (!string.IsNullOrEmpty(tur) && Enum.TryParse<IcerikTuru>(tur, true, out var turEnum))
            {
                query = query.Where(i => i.Tur == turEnum);
            }

            // Minimum puan filtresi
            if (minPuan.HasValue)
            {
                query = query.Where(i => i.OrtalamaPuan >= minPuan.Value);
            }

            // Yıl aralığı filtresi
            if (minYil.HasValue)
            {
                query = query.Where(i => i.YayinTarihi.HasValue && i.YayinTarihi.Value.Year >= minYil.Value);
            }

            if (maxYil.HasValue)
            {
                query = query.Where(i => i.YayinTarihi.HasValue && i.YayinTarihi.Value.Year <= maxYil.Value);
            }

            // Sıralama
            query = siralama?.ToLower() switch
            {
                "puan" => query.OrderByDescending(i => i.OrtalamaPuan).ThenByDescending(i => i.PuanlamaSayisi),
                "tarih" => query.OrderByDescending(i => i.YayinTarihi ?? DateOnly.MinValue),
                "yeni" => query.OrderByDescending(i => i.OlusturulmaZamani),
                _ => query.OrderByDescending(i => i.PopulerlikSkoru)
            };

            var toplam = await query.CountAsync();
            var icerikler = await query
                .Skip((sayfa - 1) * limit)
                .Take(limit)
                .ToListAsync();

            var response = icerikler.Select(i => new IcerikListDto
            {
                Id = i.Id,
                Baslik = i.Baslik,
                Tur = i.Tur.ToString(),
                PosterUrl = i.PosterUrl,
                OrtalamaPuan = i.OrtalamaPuan,
                PuanlamaSayisi = i.PuanlamaSayisi,
                PopulerlikSkoru = i.PopulerlikSkoru,
                YayinTarihi = i.YayinTarihi
            }).ToList();

            Response.Headers.Append("X-Toplam-Sayfa", ((toplam + limit - 1) / limit).ToString());
            Response.Headers.Append("X-Toplam-Kayit", toplam.ToString());

            return Ok(response);
        }

        // POST: api/icerik (Manual ekleme - admin/moderator için)
        [HttpPost]
        [Authorize(Roles = "yonetici,moderator")]
        public async Task<ActionResult<IcerikDetailDto>> CreateIcerik([FromBody] IcerikCreateDto dto)
        {
            try
            {
                // ApiKaynak ve IcerikTuru enum'a çevir
                if (!Enum.TryParse<ApiKaynak>(dto.ApiKaynagi, true, out var apiKaynak))
                {
                    return BadRequest(new { message = "Geçersiz API kaynağı." });
                }

                if (!Enum.TryParse<IcerikTuru>(dto.Tur, true, out var tur))
                {
                    return BadRequest(new { message = "Geçersiz içerik türü." });
                }

                var icerik = new Icerik
                {
                    HariciId = dto.HariciId,
                    ApiKaynagi = apiKaynak,
                    Tur = tur,
                    Baslik = dto.Baslik,
                    Aciklama = dto.Aciklama,
                    PosterUrl = dto.PosterUrl,
                    YayinTarihi = dto.YayinTarihi,
                    OlusturulmaZamani = DateTime.UtcNow
                };

                _context.Icerikler.Add(icerik);
                await _context.SaveChangesAsync();

                var response = new IcerikDetailDto
                {
                    Id = icerik.Id,
                    HariciId = icerik.HariciId,
                    ApiKaynagi = icerik.ApiKaynagi.ToString(),
                    Tur = icerik.Tur.ToString(),
                    Baslik = icerik.Baslik,
                    Aciklama = icerik.Aciklama,
                    PosterUrl = icerik.PosterUrl,
                    YayinTarihi = icerik.YayinTarihi,
                    OrtalamaPuan = 0,
                    PuanlamaSayisi = 0,
                    YorumSayisi = 0,
                    ListeyeEklenmeSayisi = 0,
                    GoruntulemeSayisi = 0,
                    PopulerlikSkoru = 0,
                    OlusturulmaZamani = icerik.OlusturulmaZamani
                };

                return CreatedAtAction(nameof(GetIcerik), new { id = icerik.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "İçerik oluşturulurken hata");
                return StatusCode(500, new { message = "İçerik kaydedilirken bir hata oluştu." });
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
    }

    // Manual içerik ekleme için DTO (IcerikDtos.cs'e eklenmeli)
    public class IcerikCreateDto
    {
        public string HariciId { get; set; } = null!;
        public string ApiKaynagi { get; set; } = null!; // tmdb, google_books, diger
        public string Tur { get; set; } = null!; // film, kitap
        public string Baslik { get; set; } = null!;
        public string? Aciklama { get; set; }
        public string? PosterUrl { get; set; }
        public DateOnly? YayinTarihi { get; set; }
    }
}
