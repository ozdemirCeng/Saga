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
    public class AktiviteController : BaseApiController
    {
        private readonly SagaDbContext _context;
        private readonly ILogger<AktiviteController> _logger;

        public AktiviteController(SagaDbContext context, ILogger<AktiviteController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/aktivite/feed
        // Proje İsteri 2.1.2: Takip edilen kullanıcıların aktivite feed'i (timeline)
        [HttpGet("feed")]
        [Authorize]
        public async Task<ActionResult<List<AktiviteFeedDto>>> GetFeed(
            [FromQuery] string? aktiviteTuru = null,
            [FromQuery] int sayfa = 1,
            [FromQuery] int limit = 15)  // Proje isterine göre 10-15
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                // Takip edilen kullanıcıların ID'lerini al
                var takipEdilenIds = await _context.Takipler
                    .Where(t => t.TakipEdenId == currentUserId)
                    .Select(t => t.TakipEdilenId)
                    .ToListAsync();

                // Kendi ID'sini de ekle (kendi aktivitelerini de görsün)
                takipEdilenIds.Add(currentUserId);

                var query = _context.Aktiviteler
                    .Include(a => a.Kullanici)
                    .Include(a => a.Icerik)
                    .Include(a => a.Puanlama)
                    .Include(a => a.Yorum)
                    .Include(a => a.Liste)
                    .Where(a => !a.Silindi && takipEdilenIds.Contains(a.KullaniciId))
                    .AsNoTracking();

                // Aktivite türü filtresi
                if (!string.IsNullOrEmpty(aktiviteTuru) && Enum.TryParse<AktiviteTuru>(aktiviteTuru, true, out var tur))
                {
                    query = query.Where(a => a.AktiviteTuru == tur);
                }

                // Pagination
                var toplam = await query.CountAsync();
                var aktiviteler = await query
                    .OrderByDescending(a => a.OlusturulmaZamani)
                    .Skip((sayfa - 1) * limit)
                    .Take(limit)
                    .ToListAsync();

                var feedItems = await BuildFeedItems(aktiviteler, currentUserId);

                Response.Headers.Append("X-Toplam-Sayfa", ((toplam + limit - 1) / limit).ToString());
                Response.Headers.Append("X-Toplam-Kayit", toplam.ToString());
                Response.Headers.Append("X-Mevcut-Sayfa", sayfa.ToString());

                return Ok(feedItems);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Giriş yapmanız gerekiyor" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Feed yüklenirken hata");
                return StatusCode(500, new { message = "Feed yüklenirken bir hata oluştu." });
            }
        }

        // GET: api/aktivite/genel
        // Tüm kullanıcıların aktiviteleri (keşfet/explore sayfası için)
        [HttpGet("genel")]
        public async Task<ActionResult<List<AktiviteFeedDto>>> GetGenelFeed(
            [FromQuery] string? aktiviteTuru = null,
            [FromQuery] int sayfa = 1,
            [FromQuery] int limit = 20)
        {
            try
            {
                // Opsiyonel olarak giriş yapmış kullanıcıyı al
                Guid? currentUserId = null;
                try { currentUserId = GetCurrentUserId(); } catch { }
                
                var query = _context.Aktiviteler
                    .Include(a => a.Kullanici)
                    .Include(a => a.Icerik)
                    .Include(a => a.Puanlama)
                    .Include(a => a.Yorum)
                    .Include(a => a.Liste)
                    .Where(a => !a.Silindi)
                    .AsNoTracking();

                // Aktivite türü filtresi
                if (!string.IsNullOrEmpty(aktiviteTuru) && Enum.TryParse<AktiviteTuru>(aktiviteTuru, true, out var tur))
                {
                    query = query.Where(a => a.AktiviteTuru == tur);
                }

                // Pagination
                var toplam = await query.CountAsync();
                var aktiviteler = await query
                    .OrderByDescending(a => a.OlusturulmaZamani)
                    .Skip((sayfa - 1) * limit)
                    .Take(limit)
                    .ToListAsync();

                var feedItems = await BuildFeedItems(aktiviteler, currentUserId);

                Response.Headers.Append("X-Toplam-Sayfa", ((toplam + limit - 1) / limit).ToString());
                Response.Headers.Append("X-Toplam-Kayit", toplam.ToString());

                return Ok(feedItems);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Feed yüklenirken hata");
                return StatusCode(500, new { message = "Feed yüklenirken bir hata oluştu." });
            }
        }

        // GET: api/aktivite/kullanici/{kullaniciId}
        [HttpGet("kullanici/{kullaniciId}")]
        public async Task<ActionResult<List<AktiviteFeedDto>>> GetKullaniciAktiviteleri(
            Guid kullaniciId,
            [FromQuery] string? aktiviteTuru = null,
            [FromQuery] DateTime? baslangic = null,
            [FromQuery] DateTime? bitis = null,
            [FromQuery] int sayfa = 1,
            [FromQuery] int limit = 20)
        {
            var query = _context.Aktiviteler
                .Include(a => a.Kullanici)
                .Include(a => a.Icerik)
                .Include(a => a.Puanlama)
                .Include(a => a.Yorum)
                .Include(a => a.Liste)
                .Where(a => a.KullaniciId == kullaniciId && !a.Silindi)
                .AsNoTracking();

            // Aktivite türü filtresi
            if (!string.IsNullOrEmpty(aktiviteTuru) && Enum.TryParse<AktiviteTuru>(aktiviteTuru, true, out var tur))
            {
                query = query.Where(a => a.AktiviteTuru == tur);
            }

            // Tarih aralığı filtresi
            if (baslangic.HasValue)
            {
                query = query.Where(a => a.OlusturulmaZamani >= baslangic.Value);
            }

            if (bitis.HasValue)
            {
                query = query.Where(a => a.OlusturulmaZamani <= bitis.Value);
            }

            // Pagination için toplam sayı
            var toplam = await query.CountAsync();
            
            var aktiviteler = await query
                .OrderByDescending(a => a.OlusturulmaZamani)
                .Skip((sayfa - 1) * limit)
                .Take(limit)
                .ToListAsync();
            
            // Opsiyonel olarak giriş yapmış kullanıcıyı al
            Guid? currentUserId = null;
            try { currentUserId = GetCurrentUserId(); } catch { }

            var feedItems = await BuildFeedItems(aktiviteler, currentUserId);

            // Sayfalama header'ları
            Response.Headers.Append("X-Toplam-Sayfa", ((toplam + limit - 1) / limit).ToString());
            Response.Headers.Append("X-Toplam-Kayit", toplam.ToString());
            Response.Headers.Append("X-Mevcut-Sayfa", sayfa.ToString());

            return Ok(feedItems);
        }

        // GET: api/aktivite
        // Giriş yapmış kullanıcının kendi aktiviteleri
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<List<AktiviteFeedDto>>> GetMyActivities(
            [FromQuery] string? aktiviteTuru = null,
            [FromQuery] int sayfa = 1,
            [FromQuery] int limit = 10)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var query = _context.Aktiviteler
                    .Include(a => a.Kullanici)
                    .Include(a => a.Icerik)
                    .Include(a => a.Puanlama)
                    .Include(a => a.Yorum)
                    .Include(a => a.Liste)
                    .Where(a => a.KullaniciId == currentUserId && !a.Silindi)
                    .AsNoTracking();

                // Aktivite türü filtresi
                if (!string.IsNullOrEmpty(aktiviteTuru) && Enum.TryParse<AktiviteTuru>(aktiviteTuru, true, out var tur))
                {
                    query = query.Where(a => a.AktiviteTuru == tur);
                }

                // Pagination
                var toplam = await query.CountAsync();
                var aktiviteler = await query
                    .OrderByDescending(a => a.OlusturulmaZamani)
                    .Skip((sayfa - 1) * limit)
                    .Take(limit)
                    .ToListAsync();

                var feedItems = await BuildFeedItems(aktiviteler, currentUserId);

                Response.Headers.Append("X-Toplam-Sayfa", ((toplam + limit - 1) / limit).ToString());
                Response.Headers.Append("X-Toplam-Kayit", toplam.ToString());
                Response.Headers.Append("X-Mevcut-Sayfa", sayfa.ToString());

                return Ok(feedItems);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Giriş yapmanız gerekiyor" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Aktiviteler yüklenirken hata");
                return StatusCode(500, new { message = "Aktiviteler yüklenirken bir hata oluştu." });
            }
        }

        // GET: api/aktivite/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<AktiviteResponseDto>> GetAktivite(long id)
        {
            var aktivite = await _context.Aktiviteler
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == id && !a.Silindi);

            if (aktivite == null)
            {
                return NotFound(new { message = "Aktivite bulunamadı." });
            }

            var response = new AktiviteResponseDto
            {
                Id = aktivite.Id,
                KullaniciId = aktivite.KullaniciId,
                AktiviteTuru = aktivite.AktiviteTuru.ToString(),
                IcerikId = aktivite.IcerikId,
                PuanlamaId = aktivite.PuanlamaId,
                YorumId = aktivite.YorumId,
                ListeId = aktivite.ListeId,
                Veri = aktivite.Veri,
                OlusturulmaZamani = aktivite.OlusturulmaZamani
            };

            return Ok(response);
        }

        // DELETE: api/aktivite/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult> DeleteAktivite(long id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var aktivite = await _context.Aktiviteler
                    .FirstOrDefaultAsync(a => a.Id == id && !a.Silindi);

                if (aktivite == null)
                {
                    return NotFound(new { message = "Aktivite bulunamadı." });
                }

                // Sadece kendi aktivitesini silebilir
                if (aktivite.KullaniciId != currentUserId)
                {
                    return Forbid();
                }

                // Soft delete
                aktivite.Silindi = true;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Aktivite silindi." });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Giriş yapmanız gerekiyor" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Aktivite silinirken hata: {AktiviteId}", id);
                return StatusCode(500, new { message = "Aktivite silinirken bir hata oluştu." });
            }
        }

        // ============================================
        // AKTİVİTE BEĞENİ İŞLEMLERİ
        // ============================================
        
        // POST: api/aktivite/{id}/begen
        [HttpPost("{id}/begen")]
        [Authorize]
        public async Task<ActionResult<object>> AktiviteBegen(long id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                var aktivite = await _context.Aktiviteler
                    .Include(a => a.Kullanici)
                    .FirstOrDefaultAsync(a => a.Id == id);
                if (aktivite == null || aktivite.Silindi)
                    return NotFound(new { message = "Aktivite bulunamadı" });
                
                // Zaten beğenmiş mi kontrol et
                var mevcutBegeni = await _context.AktiviteBegenileri
                    .FirstOrDefaultAsync(b => b.AktiviteId == id && b.KullaniciId == currentUserId);
                
                if (mevcutBegeni != null)
                {
                    // Beğeniyi kaldır
                    _context.AktiviteBegenileri.Remove(mevcutBegeni);
                    aktivite.BegeniSayisi = Math.Max(0, aktivite.BegeniSayisi - 1);
                    await _context.SaveChangesAsync();
                    
                    return Ok(new { begendim = false, begeniSayisi = aktivite.BegeniSayisi });
                }
                
                // Yeni beğeni ekle
                var yeniBegeni = new Models.AktiviteBegeni
                {
                    AktiviteId = id,
                    KullaniciId = currentUserId,
                    OlusturulmaZamani = DateTime.UtcNow
                };
                
                _context.AktiviteBegenileri.Add(yeniBegeni);
                aktivite.BegeniSayisi = aktivite.BegeniSayisi + 1;
                
                // Bildirim PostgreSQL trigger ile otomatik oluşturuluyor (trg_bildirim_aktivite_begeni)
                
                await _context.SaveChangesAsync();
                
                return Ok(new { begendim = true, begeniSayisi = aktivite.BegeniSayisi });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Giriş yapmanız gerekiyor" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Aktivite beğenilirken hata: {AktiviteId}", id);
                return StatusCode(500, new { message = "Beğeni işlemi sırasında bir hata oluştu." });
            }
        }
        
        // GET: api/aktivite/{id}/begeniler
        [HttpGet("{id}/begeniler")]
        public async Task<ActionResult<List<AktiviteBegeniDto>>> GetAktiviteBegenileri(long id, [FromQuery] int limit = 20)
        {
            try
            {
                var begeniler = await _context.AktiviteBegenileri
                    .Include(b => b.Kullanici)
                    .Where(b => b.AktiviteId == id)
                    .OrderByDescending(b => b.OlusturulmaZamani)
                    .Take(limit)
                    .Select(b => new AktiviteBegeniDto
                    {
                        AktiviteId = b.AktiviteId,
                        KullaniciId = b.KullaniciId,
                        KullaniciAdi = b.Kullanici.KullaniciAdi,
                        AvatarUrl = b.Kullanici.AvatarUrl,
                        OlusturulmaZamani = b.OlusturulmaZamani
                    })
                    .ToListAsync();
                
                return Ok(begeniler);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Beğeniler alınırken hata: {AktiviteId}", id);
                return StatusCode(500, new { message = "Beğeniler alınırken bir hata oluştu." });
            }
        }
        
        // ============================================
        // AKTİVİTE YORUM İŞLEMLERİ
        // ============================================
        
        // POST: api/aktivite/{id}/yorum
        [HttpPost("{id}/yorum")]
        [Authorize]
        public async Task<ActionResult<AktiviteYorumDto>> AktiviteYorumEkle(long id, [FromBody] AktiviteYorumOlusturDto dto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                var aktivite = await _context.Aktiviteler
                    .Include(a => a.Kullanici)
                    .FirstOrDefaultAsync(a => a.Id == id);
                if (aktivite == null || aktivite.Silindi)
                    return NotFound(new { message = "Aktivite bulunamadı" });
                
                if (string.IsNullOrWhiteSpace(dto.Icerik))
                    return BadRequest(new { message = "Yorum içeriği boş olamaz" });
                
                // Üst yorum varsa kontrol et (yanıt durumu)
                Models.AktiviteYorum? ustYorum = null;
                if (dto.UstYorumId.HasValue)
                {
                    ustYorum = await _context.AktiviteYorumlari
                        .Include(y => y.Kullanici)
                        .FirstOrDefaultAsync(y => y.Id == dto.UstYorumId && y.AktiviteId == id);
                    if (ustYorum == null)
                        return BadRequest(new { message = "Yanıtlanacak yorum bulunamadı" });
                }
                
                var kullanici = await _context.Kullanicilar.FindAsync(currentUserId);
                
                var yeniYorum = new Models.AktiviteYorum
                {
                    AktiviteId = id,
                    KullaniciId = currentUserId,
                    Icerik = dto.Icerik.Trim(),
                    UstYorumId = dto.UstYorumId,
                    OlusturulmaZamani = DateTime.UtcNow,
                    GuncellemeZamani = DateTime.UtcNow
                };
                
                _context.AktiviteYorumlari.Add(yeniYorum);
                aktivite.YorumSayisi = aktivite.YorumSayisi + 1;
                
                // Aktivite yorum bildirimi PostgreSQL trigger ile otomatik oluşturuluyor (trg_bildirim_aktivite_yorum)
                // Yanıt bildirimi için üst yorum sahibine bildirim (bu trigger'da yok, manuel yapılıyor)
                if (ustYorum != null && ustYorum.KullaniciId != currentUserId)
                {
                    var bildirimYanit = new Bildirim
                    {
                        AliciId = ustYorum.KullaniciId,
                        GonderenId = currentUserId,
                        Tip = "yorum_yanit",
                        Baslik = "Yorumunuza Yanıt",
                        Mesaj = $"{kullanici?.KullaniciAdi ?? "Birisi"} yorumunuza yanıt verdi: \"{dto.Icerik.Substring(0, Math.Min(50, dto.Icerik.Length))}...\"",
                        AktiviteId = id,
                        LinkUrl = $"/aktivite/{id}",
                        OlusturulmaZamani = DateTime.UtcNow
                    };
                    _context.Bildirimler.Add(bildirimYanit);
                }
                
                await _context.SaveChangesAsync();
                
                return Ok(new AktiviteYorumDto
                {
                    Id = yeniYorum.Id,
                    AktiviteId = yeniYorum.AktiviteId,
                    KullaniciId = yeniYorum.KullaniciId,
                    KullaniciAdi = kullanici?.KullaniciAdi ?? "Anonim",
                    KullaniciAvatar = kullanici?.AvatarUrl,
                    Icerik = yeniYorum.Icerik,
                    UstYorumId = yeniYorum.UstYorumId,
                    BegeniSayisi = 0,
                    Begendim = false,
                    OlusturulmaZamani = yeniYorum.OlusturulmaZamani
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Giriş yapmanız gerekiyor" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Yorum eklenirken hata: {AktiviteId}", id);
                return StatusCode(500, new { message = "Yorum eklenirken bir hata oluştu." });
            }
        }
        
        // GET: api/aktivite/{id}/yorumlar
        [HttpGet("{id}/yorumlar")]
        public async Task<ActionResult<List<AktiviteYorumDto>>> GetAktiviteYorumlari(long id, [FromQuery] int sayfa = 1, [FromQuery] int limit = 20)
        {
            try
            {
                Guid? currentUserId = null;
                try { currentUserId = GetCurrentUserId(); } catch { }
                
                var yorumlar = await _context.AktiviteYorumlari
                    .Include(y => y.Kullanici)
                    .Include(y => y.Begeniler)
                    .Include(y => y.Yanitlar)
                        .ThenInclude(r => r.Kullanici)
                    .Where(y => y.AktiviteId == id && !y.Silindi && y.UstYorumId == null)
                    .OrderByDescending(y => y.OlusturulmaZamani)
                    .Skip((sayfa - 1) * limit)
                    .Take(limit)
                    .ToListAsync();
                
                var result = yorumlar.Select(y => new AktiviteYorumDto
                {
                    Id = y.Id,
                    AktiviteId = y.AktiviteId,
                    KullaniciId = y.KullaniciId,
                    KullaniciAdi = y.Kullanici.KullaniciAdi,
                    KullaniciAvatar = y.Kullanici.AvatarUrl,
                    Icerik = y.Icerik,
                    BegeniSayisi = y.BegeniSayisi,
                    Begendim = currentUserId.HasValue && y.Begeniler.Any(b => b.KullaniciId == currentUserId),
                    OlusturulmaZamani = y.OlusturulmaZamani,
                    Yanitlar = y.Yanitlar
                        .Where(r => !r.Silindi)
                        .OrderBy(r => r.OlusturulmaZamani)
                        .Select(r => new AktiviteYorumDto
                        {
                            Id = r.Id,
                            AktiviteId = r.AktiviteId,
                            KullaniciId = r.KullaniciId,
                            KullaniciAdi = r.Kullanici.KullaniciAdi,
                            KullaniciAvatar = r.Kullanici.AvatarUrl,
                            Icerik = r.Icerik,
                            UstYorumId = r.UstYorumId,
                            BegeniSayisi = r.BegeniSayisi,
                            Begendim = currentUserId.HasValue && r.Begeniler.Any(b => b.KullaniciId == currentUserId),
                            OlusturulmaZamani = r.OlusturulmaZamani
                        }).ToList()
                }).ToList();
                
                var toplam = await _context.AktiviteYorumlari
                    .CountAsync(y => y.AktiviteId == id && !y.Silindi && y.UstYorumId == null);
                
                Response.Headers.Append("X-Toplam-Sayfa", ((toplam + limit - 1) / limit).ToString());
                Response.Headers.Append("X-Toplam-Kayit", toplam.ToString());
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Yorumlar alınırken hata: {AktiviteId}", id);
                return StatusCode(500, new { message = "Yorumlar alınırken bir hata oluştu." });
            }
        }
        
        // POST: api/aktivite/yorum/{yorumId}/begen
        [HttpPost("yorum/{yorumId}/begen")]
        [Authorize]
        public async Task<ActionResult<object>> AktiviteYorumBegen(long yorumId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                var yorum = await _context.AktiviteYorumlari
                    .Include(y => y.Kullanici)
                    .FirstOrDefaultAsync(y => y.Id == yorumId);
                if (yorum == null || yorum.Silindi)
                    return NotFound(new { message = "Yorum bulunamadı" });
                
                var mevcutBegeni = await _context.AktiviteYorumBegenileri
                    .FirstOrDefaultAsync(b => b.YorumId == yorumId && b.KullaniciId == currentUserId);
                
                if (mevcutBegeni != null)
                {
                    _context.AktiviteYorumBegenileri.Remove(mevcutBegeni);
                    yorum.BegeniSayisi = Math.Max(0, yorum.BegeniSayisi - 1);
                    await _context.SaveChangesAsync();
                    return Ok(new { begendim = false, begeniSayisi = yorum.BegeniSayisi });
                }
                
                var yeniBegeni = new Models.AktiviteYorumBegeni
                {
                    YorumId = yorumId,
                    KullaniciId = currentUserId,
                    OlusturulmaZamani = DateTime.UtcNow
                };
                
                _context.AktiviteYorumBegenileri.Add(yeniBegeni);
                yorum.BegeniSayisi = yorum.BegeniSayisi + 1;
                
                // Bildirim oluştur (kendi yorumunu beğendiyse hariç)
                if (yorum.KullaniciId != currentUserId)
                {
                    var begenen = await _context.Kullanicilar.FindAsync(currentUserId);
                    var bildirim = new Bildirim
                    {
                        AliciId = yorum.KullaniciId,
                        GonderenId = currentUserId,
                        Tip = "yorum_begeni",
                        Baslik = "Yorumunuz Beğenildi",
                        Mesaj = $"{begenen?.KullaniciAdi ?? "Birisi"} yorumunuzu beğendi: \"{yorum.Icerik.Substring(0, Math.Min(30, yorum.Icerik.Length))}...\"",
                        AktiviteId = yorum.AktiviteId,
                        LinkUrl = $"/aktivite/{yorum.AktiviteId}",
                        OlusturulmaZamani = DateTime.UtcNow
                    };
                    _context.Bildirimler.Add(bildirim);
                }
                
                await _context.SaveChangesAsync();
                
                return Ok(new { begendim = true, begeniSayisi = yorum.BegeniSayisi });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Giriş yapmanız gerekiyor" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Yorum beğenilirken hata: {YorumId}", yorumId);
                return StatusCode(500, new { message = "Beğeni işlemi sırasında bir hata oluştu." });
            }
        }
        
        // DELETE: api/aktivite/yorum/{yorumId}
        [HttpDelete("yorum/{yorumId}")]
        [Authorize]
        public async Task<ActionResult> AktiviteYorumSil(long yorumId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                var yorum = await _context.AktiviteYorumlari
                    .Include(y => y.Aktivite)
                    .FirstOrDefaultAsync(y => y.Id == yorumId);
                if (yorum == null)
                    return NotFound(new { message = "Yorum bulunamadı" });
                
                if (yorum.KullaniciId != currentUserId)
                    return Forbid();
                
                yorum.Silindi = true;
                yorum.GuncellemeZamani = DateTime.UtcNow;
                
                // Aktivite yorum sayısını güncelle
                if (yorum.Aktivite != null)
                {
                    yorum.Aktivite.YorumSayisi = Math.Max(0, yorum.Aktivite.YorumSayisi - 1);
                }
                
                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Yorum silindi" });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "Giriş yapmanız gerekiyor" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Yorum silinirken hata: {YorumId}", yorumId);
                return StatusCode(500, new { message = "Yorum silinirken bir hata oluştu." });
            }
        }

        // Helper Methods
        private async Task<List<AktiviteFeedDto>> BuildFeedItems(List<Aktivite> aktiviteler, Guid? currentUserId = null)
        {
            var feedItems = new List<AktiviteFeedDto>();
            
            // Tüm aktivite ID'lerini al
            var aktiviteIds = aktiviteler.Select(a => a.Id).ToList();
            
            // Kullanıcının beğenilerini tek sorguda al
            HashSet<long> begenilenAktiviteIds = new();
            if (currentUserId.HasValue)
            {
                begenilenAktiviteIds = (await _context.AktiviteBegenileri
                    .Where(b => aktiviteIds.Contains(b.AktiviteId) && b.KullaniciId == currentUserId)
                    .Select(b => b.AktiviteId)
                    .ToListAsync())
                    .ToHashSet();
            }

            foreach (var aktivite in aktiviteler)
            {
                var feedItem = new AktiviteFeedDto
                {
                    Id = aktivite.Id,
                    KullaniciId = aktivite.KullaniciId,
                    KullaniciAdi = aktivite.Kullanici.KullaniciAdi,
                    KullaniciAvatar = aktivite.Kullanici.AvatarUrl,
                    AktiviteTuru = aktivite.AktiviteTuru.ToString(),
                    IcerikId = aktivite.IcerikId,
                    IcerikTur = aktivite.Icerik?.Tur.ToString(),
                    YorumId = aktivite.YorumId,
                    OlusturulmaZamani = aktivite.OlusturulmaZamani,
                    BegeniSayisi = aktivite.BegeniSayisi,
                    YorumSayisi = aktivite.YorumSayisi,
                    PaylasimSayisi = aktivite.PaylasimSayisi,
                    Begendim = begenilenAktiviteIds.Contains(aktivite.Id),
                    Veri = await BuildAktiviteVeri(aktivite)
                };

                feedItems.Add(feedItem);
            }

            return feedItems;
        }

        private async Task<AktiviteVeriDto?> BuildAktiviteVeri(Aktivite aktivite)
        {
            var veri = new AktiviteVeriDto();

            switch (aktivite.AktiviteTuru)
            {
                case AktiviteTuru.puanlama:
                    if (aktivite.Puanlama != null)
                    {
                        var icerik = await _context.Icerikler.FindAsync(aktivite.Puanlama.IcerikId);
                        veri.Baslik = icerik?.Baslik;
                        veri.PosterUrl = icerik?.PosterUrl;
                        veri.Tur = icerik?.Tur.ToString();
                        veri.Puan = aktivite.Puanlama.Puan;
                    }
                    break;

                case AktiviteTuru.yorum:
                    if (aktivite.Yorum != null)
                    {
                        var icerik = await _context.Icerikler.FindAsync(aktivite.Yorum.IcerikId);
                        veri.Baslik = icerik?.Baslik;
                        veri.PosterUrl = icerik?.PosterUrl;
                        veri.Tur = icerik?.Tur.ToString();
                        veri.SpoilerIceriyor = aktivite.Yorum.SpoilerIceriyor;
                        veri.YorumOzet = aktivite.Yorum.IcerikMetni.Length > 100
                            ? aktivite.Yorum.IcerikMetni.Substring(0, 100) + "..."
                            : aktivite.Yorum.IcerikMetni;
                    }
                    break;

                case AktiviteTuru.listeye_ekleme:
                    if (aktivite.Liste != null && aktivite.Icerik != null)
                    {
                        veri.ListeAdi = aktivite.Liste.Ad;
                        veri.Baslik = aktivite.Icerik.Baslik;
                        veri.PosterUrl = aktivite.Icerik.PosterUrl;
                        veri.Tur = aktivite.Icerik.Tur.ToString();
                    }
                    break;

                case AktiviteTuru.takip:
                    // Veri JSONB'den parse et
                    try
                    {
                        var jsonData = JsonSerializer.Deserialize<Dictionary<string, object>>(aktivite.Veri);
                        if (jsonData != null && jsonData.ContainsKey("takipEdilenId"))
                        {
                            var takipEdilenIdStr = jsonData["takipEdilenId"].ToString();
                            if (Guid.TryParse(takipEdilenIdStr, out var takipEdilenId))
                            {
                                var takipEdilen = await _context.Kullanicilar.FindAsync(takipEdilenId);
                                veri.TakipEdilenKullaniciAdi = takipEdilen?.KullaniciAdi;
                                veri.TakipEdilenAvatar = takipEdilen?.AvatarUrl;
                            }
                        }
                    }
                    catch { }
                    break;

                case AktiviteTuru.durum_guncelleme:
                    if (aktivite.Icerik != null)
                    {
                        veri.Baslik = aktivite.Icerik.Baslik;
                        veri.PosterUrl = aktivite.Icerik.PosterUrl;
                        veri.Tur = aktivite.Icerik.Tur.ToString();

                        // Veri JSONB'den durum bilgisini al
                        try
                        {
                            var jsonData = JsonSerializer.Deserialize<Dictionary<string, object>>(aktivite.Veri);
                            if (jsonData != null && jsonData.ContainsKey("durum"))
                            {
                                veri.Durum = jsonData["durum"].ToString();
                            }
                        }
                        catch { }
                    }
                    break;
            }

            return veri;
        }
    }
}
