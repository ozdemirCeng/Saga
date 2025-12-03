using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Saga.Server.Data;
using Saga.Server.DTOs;
using Saga.Server.Models;
using System.Text.Json;

namespace Saga.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IcerikController : BaseApiController
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

            // İstatistikler zaten Icerik tablosunda trigger ile güncelleniyor, tekrar saymaya gerek yok.
            // var yorumSayisi = await _context.Yorumlar.CountAsync(y => y.IcerikId == id && !y.Silindi);
            // var listeyeEklenmeSayisi = await _context.ListeIcerikleri.CountAsync(li => li.IcerikId == id);

            // Oyuncuları tablodan çek
            var oyuncular = await _context.IcerikOyunculari
                .Include(io => io.Oyuncu)
                .Where(io => io.IcerikId == id)
                .OrderBy(io => io.Sira)
                .Select(io => new OyuncuInfoDto
                {
                    Id = io.Oyuncu.Id,
                    HariciId = io.Oyuncu.HariciId,
                    Ad = io.Oyuncu.Ad,
                    Karakter = io.Karakter,
                    ProfilUrl = io.Oyuncu.ProfilUrl,
                    RolTipi = io.RolTipi
                })
                .ToListAsync();

            // Yönetmeni bul (RolTipi = yonetmen)
            var yonetmenler = oyuncular.Where(o => o.RolTipi == "yonetmen").ToList();
            var oyuncuListesi = oyuncular.Where(o => o.RolTipi == "oyuncu").ToList();

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
                HariciPuan = icerik.HariciPuan,
                HariciOySayisi = icerik.HariciOySayisi,
                YorumSayisi = icerik.YorumSayisi,
                ListeyeEklenmeSayisi = icerik.ListeyeEklenmeSayisi,
                GoruntulemeSayisi = icerik.GoruntulemeSayisi,
                PopulerlikSkoru = icerik.PopulerlikSkoru,
                OlusturulmaZamani = icerik.OlusturulmaZamani,
                KullaniciPuani = kullaniciPuani,
                KullanicininDurumu = kullanicininDurumu,
                Oyuncular = oyuncuListesi.Any() ? oyuncuListesi : null,
                Yonetmen = yonetmenler.FirstOrDefault()?.Ad
            };

            // Meta veriyi parse et (türler, süre vs. için)
            if (!string.IsNullOrEmpty(icerik.MetaVeri) && icerik.MetaVeri != "{}")
            {
                try
                {
                    var metaDoc = JsonDocument.Parse(icerik.MetaVeri);
                    var root = metaDoc.RootElement;

                    // Eğer tablodan yönetmen bulunamadıysa, meta veriden al
                    if (string.IsNullOrEmpty(response.Yonetmen) && 
                        root.TryGetProperty("yonetmen", out var yonetmen) && yonetmen.ValueKind != JsonValueKind.Null)
                    {
                        response.Yonetmen = yonetmen.GetString();
                    }

                    // Eğer tablodan oyuncu bulunamadıysa, meta veriden al (eski veriler için)
                    if ((response.Oyuncular == null || !response.Oyuncular.Any()) &&
                        root.TryGetProperty("oyuncular", out var oyuncularJson) && oyuncularJson.ValueKind == JsonValueKind.Array)
                    {
                        response.Oyuncular = new List<OyuncuInfoDto>();
                        foreach (var oyuncu in oyuncularJson.EnumerateArray())
                        {
                            response.Oyuncular.Add(new OyuncuInfoDto
                            {
                                Ad = oyuncu.TryGetProperty("ad", out var ad) ? ad.GetString() ?? "" : "",
                                Karakter = oyuncu.TryGetProperty("karakter", out var karakter) ? karakter.GetString() : null,
                                ProfilUrl = oyuncu.TryGetProperty("profilUrl", out var profil) ? profil.GetString() : null
                            });
                        }
                    }

                    if (root.TryGetProperty("turler", out var turler) && turler.ValueKind == JsonValueKind.Array)
                    {
                        response.Turler = new List<string>();
                        foreach (var tur in turler.EnumerateArray())
                        {
                            var turStr = tur.GetString();
                            if (!string.IsNullOrEmpty(turStr))
                            {
                                response.Turler.Add(turStr);
                            }
                        }
                    }

                    if (root.TryGetProperty("sure", out var sure) && sure.ValueKind == JsonValueKind.Number)
                    {
                        response.Sure = sure.GetInt32();
                    }

                    if (root.TryGetProperty("sezonSayisi", out var sezon) && sezon.ValueKind == JsonValueKind.Number)
                    {
                        response.SezonSayisi = sezon.GetInt32();
                    }

                    if (root.TryGetProperty("bolumSayisi", out var bolum) && bolum.ValueKind == JsonValueKind.Number)
                    {
                        response.BolumSayisi = bolum.GetInt32();
                    }

                    // Kitap meta verileri
                    if (root.TryGetProperty("yazarlar", out var yazarlar) && yazarlar.ValueKind == JsonValueKind.Array)
                    {
                        response.Yazarlar = new List<string>();
                        foreach (var yazar in yazarlar.EnumerateArray())
                        {
                            var yazarStr = yazar.GetString();
                            if (!string.IsNullOrEmpty(yazarStr))
                            {
                                response.Yazarlar.Add(yazarStr);
                            }
                        }
                    }

                    if (root.TryGetProperty("sayfaSayisi", out var sayfa) && sayfa.ValueKind == JsonValueKind.Number)
                    {
                        response.SayfaSayisi = sayfa.GetInt32();
                    }

                    if (root.TryGetProperty("yayinevi", out var yayinevi) && yayinevi.ValueKind != JsonValueKind.Null)
                    {
                        response.Yayinevi = yayinevi.GetString();
                    }

                    if (root.TryGetProperty("isbn", out var isbn) && isbn.ValueKind != JsonValueKind.Null)
                    {
                        response.ISBN = isbn.GetString();
                    }

                    if (root.TryGetProperty("kategoriler", out var kategoriler) && kategoriler.ValueKind == JsonValueKind.Array)
                    {
                        response.Kategoriler = new List<string>();
                        foreach (var kategori in kategoriler.EnumerateArray())
                        {
                            var kategoriStr = kategori.GetString();
                            if (!string.IsNullOrEmpty(kategoriStr))
                            {
                                response.Kategoriler.Add(kategoriStr);
                            }
                        }
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Meta veri parse edilemedi: IcerikId={IcerikId}", id);
                }
            }

            return Ok(response);
        }

        // GET: api/icerik/ara?q={query}
        // PostgreSQL Full-Text Search ile gelişmiş arama
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

            try
            {
                // PostgreSQL Full-Text Search kullan
                var searchQuery = @"
                    SELECT i.* 
                    FROM icerikler i
                    WHERE i.arama_vektoru @@ plainto_tsquery('turkish', {0})
                    ORDER BY ts_rank(i.arama_vektoru, plainto_tsquery('turkish', {0})) DESC
                    LIMIT {1} OFFSET {2}";

                var countQuery = @"
                    SELECT COUNT(*)
                    FROM icerikler i
                    WHERE i.arama_vektoru @@ plainto_tsquery('turkish', {0})";

                var offset = (sayfa - 1) * limit;

                var icerikler = await _context.Icerikler
                    .FromSqlRaw(searchQuery, q, limit, offset)
                    .AsNoTracking()
                    .ToListAsync();

                // Tür filtresi (PostgreSQL'den geldikten sonra)
                if (!string.IsNullOrEmpty(tur) && Enum.TryParse<IcerikTuru>(tur, true, out var turEnum))
                {
                    icerikler = icerikler.Where(i => i.Tur == turEnum).ToList();
                }

                var toplam = await _context.Icerikler
                    .FromSqlRaw(countQuery, q)
                    .CountAsync();

                var response = icerikler.Select(i => new IcerikSearchDto
                {
                    Id = i.Id,
                    Baslik = i.Baslik,
                    Tur = i.Tur.ToString(),
                    PosterUrl = i.PosterUrl,
                    OrtalamaPuan = i.OrtalamaPuan,
                    HariciPuan = i.HariciPuan,
                    YayinTarihi = i.YayinTarihi,
                    Aciklama = i.Aciklama != null && i.Aciklama.Length > 200
                        ? i.Aciklama.Substring(0, 200) + "..."
                        : i.Aciklama
                }).ToList();

                Response.Headers.Append("X-Toplam-Sayfa", ((toplam + limit - 1) / limit).ToString());
                Response.Headers.Append("X-Toplam-Kayit", toplam.ToString());

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Full-text search hatası, fallback'e geçiliyor");

                // Fallback: Normal LIKE sorgusu
                var query = _context.Icerikler
                    .Where(i => i.Baslik.Contains(q) || (i.Aciklama != null && i.Aciklama.Contains(q)))
                    .AsNoTracking();

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
                    HariciPuan = i.HariciPuan,
                    YayinTarihi = i.YayinTarihi,
                    Aciklama = i.Aciklama != null && i.Aciklama.Length > 200
                        ? i.Aciklama.Substring(0, 200) + "..."
                        : i.Aciklama
                }).ToList();

                Response.Headers.Append("X-Toplam-Sayfa", ((toplam + limit - 1) / limit).ToString());
                Response.Headers.Append("X-Toplam-Kayit", toplam.ToString());

                return Ok(response);
            }
        }

        // GET: api/icerik/filtrele
        // Proje İsteri 2.1.3: Gelişmiş Filtreleme (Tür, Yıl, Puan)
        [HttpGet("filtrele")]
        public async Task<ActionResult<List<IcerikListDto>>> FiltreliIcerikler(
            [FromQuery] string? tur = null,
            [FromQuery] int? yil = null,
            [FromQuery] decimal? minPuan = null,
            [FromQuery] decimal? maxPuan = null,
            [FromQuery] int sayfa = 1,
            [FromQuery] int limit = 50)
        {
            var query = _context.Icerikler.AsNoTracking();

            // Tür filtresi
            if (!string.IsNullOrEmpty(tur) && Enum.TryParse<IcerikTuru>(tur, true, out var turEnum))
            {
                query = query.Where(i => i.Tur == turEnum);
            }

            // Yıl filtresi
            if (yil.HasValue)
            {
                query = query.Where(i => i.YayinTarihi.HasValue && i.YayinTarihi.Value.Year == yil.Value);
            }

            // Puan filtresi
            if (minPuan.HasValue)
            {
                query = query.Where(i => i.OrtalamaPuan >= minPuan.Value);
            }

            if (maxPuan.HasValue)
            {
                query = query.Where(i => i.OrtalamaPuan <= maxPuan.Value);
            }

            var toplam = await query.CountAsync();
            var icerikler = await query
                .OrderByDescending(i => i.PopulerlikSkoru)
                .Skip((sayfa - 1) * limit)
                .Take(limit)
                .ToListAsync();

            var response = icerikler.Select(i => new IcerikListDto
            {
                Id = i.Id,
                Baslik = i.Baslik,
                Tur = i.Tur.ToString(),
                Aciklama = i.Aciklama,
                PosterUrl = i.PosterUrl,
                OrtalamaPuan = i.OrtalamaPuan,
                HariciPuan = i.HariciPuan,
                HariciOySayisi = i.HariciOySayisi,
                YayinTarihi = i.YayinTarihi,
                PopulerlikSkoru = i.PopulerlikSkoru
            }).ToList();

            Response.Headers.Append("X-Toplam-Sayfa", ((toplam + limit - 1) / limit).ToString());
            Response.Headers.Append("X-Toplam-Kayit", toplam.ToString());

            return Ok(response);
        }

        // GET: api/icerik/en-yuksek-puanlilar
        // Proje İsteri 2.1.3: En Yüksek Puanlılar Vitrini
        [HttpGet("en-yuksek-puanlilar")]
        public async Task<ActionResult<List<IcerikListDto>>> GetEnYuksekPuanlilar(
            [FromQuery] string? tur = null,
            [FromQuery] int limit = 20)
        {
            var query = _context.Icerikler
                .Where(i => i.PuanlamaSayisi >= 5)  // En az 5 puan almış olmalı
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
                Aciklama = i.Aciklama,
                PosterUrl = i.PosterUrl,
                OrtalamaPuan = i.OrtalamaPuan,
                HariciPuan = i.HariciPuan,
                HariciOySayisi = i.HariciOySayisi,
                YayinTarihi = i.YayinTarihi,
                PopulerlikSkoru = i.PopulerlikSkoru,
                PuanlamaSayisi = i.PuanlamaSayisi
            }).ToList();

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
                Aciklama = i.Aciklama,
                PosterUrl = i.PosterUrl,
                OrtalamaPuan = i.OrtalamaPuan,
                HariciPuan = i.HariciPuan,
                HariciOySayisi = i.HariciOySayisi,
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
                Aciklama = i.Aciklama,
                PosterUrl = i.PosterUrl,
                OrtalamaPuan = i.OrtalamaPuan,
                HariciPuan = i.HariciPuan,
                HariciOySayisi = i.HariciOySayisi,
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
                    Aciklama = i.Aciklama,
                    PosterUrl = i.PosterUrl,
                    OrtalamaPuan = i.OrtalamaPuan,
                    HariciPuan = i.HariciPuan,
                    HariciOySayisi = i.HariciOySayisi,
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

        // Helper Methods BaseApiController üzerinden gelmektedir.
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
