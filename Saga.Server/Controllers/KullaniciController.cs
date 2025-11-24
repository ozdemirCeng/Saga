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
    public class KullaniciController : ControllerBase
    {
        private readonly SagaDbContext _context;
        private readonly ILogger<KullaniciController> _logger;

        public KullaniciController(SagaDbContext context, ILogger<KullaniciController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/kullanici/{id}/profil
        [HttpGet("{id}/profil")]
        public async Task<ActionResult<ProfilDto>> GetProfil(Guid id)
        {
            var kullanici = await _context.Kullanicilar
                .AsNoTracking()
                .FirstOrDefaultAsync(k => k.Id == id && !k.Silindi);

            if (kullanici == null)
            {
                return NotFound(new { message = "Kullanıcı bulunamadı." });
            }

            var currentUserId = GetCurrentUserIdOrNull();

            // İstatistikleri al
            var toplamPuanlama = await _context.Puanlamalar.CountAsync(p => p.KullaniciId == id && !p.Silindi);
            var toplamYorum = await _context.Yorumlar.CountAsync(y => y.KullaniciId == id && !y.Silindi);
            var toplamListe = await _context.Listeler.CountAsync(l => l.KullaniciId == id && !l.Silindi);
            var takipEdenSayisi = await _context.Takipler.CountAsync(t => t.TakipEdilenId == id);
            var takipEdilenSayisi = await _context.Takipler.CountAsync(t => t.TakipEdenId == id);

            var takipEdiyorMu = currentUserId.HasValue &&
                await _context.Takipler.AnyAsync(t => t.TakipEdenId == currentUserId.Value && t.TakipEdilenId == id);

            var profil = new ProfilDto
            {
                Id = kullanici.Id,
                KullaniciAdi = kullanici.KullaniciAdi,
                Eposta = kullanici.Eposta,
                GoruntulemeAdi = kullanici.GoruntulemeAdi,
                Biyografi = kullanici.Biyografi,
                AvatarUrl = kullanici.AvatarUrl,
                Rol = kullanici.Rol.ToString(),
                OlusturulmaZamani = kullanici.OlusturulmaZamani,
                ToplamPuanlama = toplamPuanlama,
                ToplamYorum = toplamYorum,
                ToplamListe = toplamListe,
                TakipEdenSayisi = takipEdenSayisi,
                TakipEdilenSayisi = takipEdilenSayisi,
                TakipEdiyorMu = takipEdiyorMu
            };

            return Ok(profil);
        }

        // PUT: api/kullanici/profil
        [HttpPut("profil")]
        [Authorize]
        public async Task<ActionResult<ProfilDto>> UpdateProfil([FromBody] ProfilUpdateDto dto)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var kullanici = await _context.Kullanicilar
                    .FirstOrDefaultAsync(k => k.Id == kullaniciId);

                if (kullanici == null)
                {
                    return NotFound(new { message = "Kullanıcı bulunamadı." });
                }

                kullanici.GoruntulemeAdi = dto.GoruntulemeAdi;
                kullanici.Biyografi = dto.Biyografi;
                kullanici.AvatarUrl = dto.AvatarUrl;
                kullanici.GuncellemeZamani = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Güncel profili döndür
                var toplamPuanlama = await _context.Puanlamalar.CountAsync(p => p.KullaniciId == kullaniciId && !p.Silindi);
                var toplamYorum = await _context.Yorumlar.CountAsync(y => y.KullaniciId == kullaniciId && !y.Silindi);
                var toplamListe = await _context.Listeler.CountAsync(l => l.KullaniciId == kullaniciId && !l.Silindi);
                var takipEdenSayisi = await _context.Takipler.CountAsync(t => t.TakipEdilenId == kullaniciId);
                var takipEdilenSayisi = await _context.Takipler.CountAsync(t => t.TakipEdenId == kullaniciId);

                var profil = new ProfilDto
                {
                    Id = kullanici.Id,
                    KullaniciAdi = kullanici.KullaniciAdi,
                    Eposta = kullanici.Eposta,
                    GoruntulemeAdi = kullanici.GoruntulemeAdi,
                    Biyografi = kullanici.Biyografi,
                    AvatarUrl = kullanici.AvatarUrl,
                    Rol = kullanici.Rol.ToString(),
                    OlusturulmaZamani = kullanici.OlusturulmaZamani,
                    ToplamPuanlama = toplamPuanlama,
                    ToplamYorum = toplamYorum,
                    ToplamListe = toplamListe,
                    TakipEdenSayisi = takipEdenSayisi,
                    TakipEdilenSayisi = takipEdilenSayisi,
                    TakipEdiyorMu = false
                };

                return Ok(profil);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Profil güncellenirken hata: {KullaniciId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Profil güncellenirken bir hata oluştu." });
            }
        }

        // POST: api/kullanici/{id}/takip
        [HttpPost("{id}/takip")]
        [Authorize]
        public async Task<IActionResult> ToggleTakip(Guid id)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                // Kendini takip edemez
                if (kullaniciId == id)
                {
                    return BadRequest(new { message = "Kendinizi takip edemezsiniz." });
                }

                // Kullanıcı var mı?
                var takipEdilecek = await _context.Kullanicilar.FindAsync(id);
                if (takipEdilecek == null || takipEdilecek.Silindi)
                {
                    return NotFound(new { message = "Kullanıcı bulunamadı." });
                }

                var mevcutTakip = await _context.Takipler
                    .FirstOrDefaultAsync(t => t.TakipEdenId == kullaniciId && t.TakipEdilenId == id);

                if (mevcutTakip != null)
                {
                    // Takibi bırak
                    _context.Takipler.Remove(mevcutTakip);
                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Takip bırakıldı", takipEdiyor = false });
                }
                else
                {
                    // Takip et
                    var takip = new Takip
                    {
                        TakipEdenId = kullaniciId,
                        TakipEdilenId = id,
                        OlusturulmaZamani = DateTime.UtcNow
                    };
                    _context.Takipler.Add(takip);
                    await _context.SaveChangesAsync();

                    // Aktivite kaydı
                    await CreateTakipAktivite(kullaniciId, id);

                    return Ok(new { message = "Kullanıcı takip edildi", takipEdiyor = true });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Takip işlemi sırasında hata: {TakipEdilenId}", id);
                return StatusCode(500, new { message = "Takip işlemi sırasında bir hata oluştu." });
            }
        }

        // GET: api/kullanici/{id}/takip-edenler
        [HttpGet("{id}/takip-edenler")]
        public async Task<ActionResult<List<KullaniciListDto>>> GetTakipEdenler(Guid id)
        {
            var takipler = await _context.Takipler
                .Include(t => t.TakipEden)
                .Where(t => t.TakipEdilenId == id)
                .OrderByDescending(t => t.OlusturulmaZamani)
                .AsNoTracking()
                .ToListAsync();

            var kullanicilar = new List<KullaniciListDto>();

            foreach (var takip in takipler)
            {
                var toplamPuanlama = await _context.Puanlamalar.CountAsync(p => p.KullaniciId == takip.TakipEdenId && !p.Silindi);
                var takipEdenSayisi = await _context.Takipler.CountAsync(t => t.TakipEdilenId == takip.TakipEdenId);

                kullanicilar.Add(new KullaniciListDto
                {
                    Id = takip.TakipEden.Id,
                    KullaniciAdi = takip.TakipEden.KullaniciAdi,
                    GoruntulemeAdi = takip.TakipEden.GoruntulemeAdi,
                    AvatarUrl = takip.TakipEden.AvatarUrl,
                    TakipEdenSayisi = takipEdenSayisi,
                    ToplamPuanlama = toplamPuanlama
                });
            }

            return Ok(kullanicilar);
        }

        // GET: api/kullanici/{id}/takip-ettikleri
        [HttpGet("{id}/takip-ettikleri")]
        public async Task<ActionResult<List<KullaniciListDto>>> GetTakipEttikleri(Guid id)
        {
            var takipler = await _context.Takipler
                .Include(t => t.TakipEdilen)
                .Where(t => t.TakipEdenId == id)
                .OrderByDescending(t => t.OlusturulmaZamani)
                .AsNoTracking()
                .ToListAsync();

            var kullanicilar = new List<KullaniciListDto>();

            foreach (var takip in takipler)
            {
                var toplamPuanlama = await _context.Puanlamalar.CountAsync(p => p.KullaniciId == takip.TakipEdilenId && !p.Silindi);
                var takipEdenSayisi = await _context.Takipler.CountAsync(t => t.TakipEdilenId == takip.TakipEdilenId);

                kullanicilar.Add(new KullaniciListDto
                {
                    Id = takip.TakipEdilen.Id,
                    KullaniciAdi = takip.TakipEdilen.KullaniciAdi,
                    GoruntulemeAdi = takip.TakipEdilen.GoruntulemeAdi,
                    AvatarUrl = takip.TakipEdilen.AvatarUrl,
                    TakipEdenSayisi = takipEdenSayisi,
                    ToplamPuanlama = toplamPuanlama
                });
            }

            return Ok(kullanicilar);
        }

        // GET: api/kullanici/{id}/istatistik
        [HttpGet("{id}/istatistik")]
        public async Task<ActionResult<KullaniciIstatistikDto>> GetIstatistik(Guid id)
        {
            var kullanici = await _context.Kullanicilar.FindAsync(id);
            if (kullanici == null || kullanici.Silindi)
            {
                return NotFound(new { message = "Kullanıcı bulunamadı." });
            }

            var toplamIzlenenFilm = await _context.KutuphaneDurumlari
                .Include(k => k.Icerik)
                .CountAsync(k => k.KullaniciId == id && k.Icerik.Tur == IcerikTuru.film && k.Durum == KutuphaneDurum.izlendi && !k.Silindi);

            var toplamOkunanKitap = await _context.KutuphaneDurumlari
                .Include(k => k.Icerik)
                .CountAsync(k => k.KullaniciId == id && k.Icerik.Tur == IcerikTuru.kitap && k.Durum == KutuphaneDurum.okundu && !k.Silindi);

            var toplamPuanlama = await _context.Puanlamalar.CountAsync(p => p.KullaniciId == id && !p.Silindi);
            var toplamYorum = await _context.Yorumlar.CountAsync(y => y.KullaniciId == id && !y.Silindi);
            var toplamListe = await _context.Listeler.CountAsync(l => l.KullaniciId == id && !l.Silindi);

            var takipEdenSayisi = await _context.Takipler.CountAsync(t => t.TakipEdilenId == id);
            var takipEdilenSayisi = await _context.Takipler.CountAsync(t => t.TakipEdenId == id);

            var puanlamalar = await _context.Puanlamalar
                .Where(p => p.KullaniciId == id && !p.Silindi)
                .ToListAsync();

            var ortalamaPuan = puanlamalar.Any() ? (decimal)puanlamalar.Average(p => p.Puan) : 0;

            var istatistik = new KullaniciIstatistikDto
            {
                KullaniciId = id,
                ToplamIzlenenFilm = toplamIzlenenFilm,
                ToplamOkunanKitap = toplamOkunanKitap,
                ToplamPuanlama = toplamPuanlama,
                ToplamYorum = toplamYorum,
                ToplamListe = toplamListe,
                TakipEdenSayisi = takipEdenSayisi,
                TakipEdilenSayisi = takipEdilenSayisi,
                OrtalamaPuan = ortalamaPuan
            };

            return Ok(istatistik);
        }

        // GET: api/kullanici/ara?q={query}
        [HttpGet("ara")]
        public async Task<ActionResult<List<KullaniciListDto>>> SearchKullanicilar([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            {
                return BadRequest(new { message = "Arama terimi en az 2 karakter olmalıdır." });
            }

            var kullanicilar = await _context.Kullanicilar
                .Where(k => !k.Silindi &&
                    (k.KullaniciAdi.Contains(q) ||
                     (k.GoruntulemeAdi != null && k.GoruntulemeAdi.Contains(q))))
                .Take(20)
                .AsNoTracking()
                .ToListAsync();

            var result = new List<KullaniciListDto>();

            foreach (var kullanici in kullanicilar)
            {
                var toplamPuanlama = await _context.Puanlamalar.CountAsync(p => p.KullaniciId == kullanici.Id && !p.Silindi);
                var takipEdenSayisi = await _context.Takipler.CountAsync(t => t.TakipEdilenId == kullanici.Id);

                result.Add(new KullaniciListDto
                {
                    Id = kullanici.Id,
                    KullaniciAdi = kullanici.KullaniciAdi,
                    GoruntulemeAdi = kullanici.GoruntulemeAdi,
                    AvatarUrl = kullanici.AvatarUrl,
                    TakipEdenSayisi = takipEdenSayisi,
                    ToplamPuanlama = toplamPuanlama
                });
            }

            return Ok(result);
        }

        // GET: api/kullanici/{id}/aktiviteler
        // Proje İsterler 2.1.5: Kullanıcının son aktiviteleri
        [HttpGet("{id}/aktiviteler")]
        public async Task<ActionResult<List<AktiviteDto>>> GetKullaniciAktiviteleri(
            Guid id,
            [FromQuery] int sayfa = 1,
            [FromQuery] int limit = 20)
        {
            var aktiviteler = await _context.Aktiviteler
                .Include(a => a.Kullanici)
                .Include(a => a.Icerik)
                .Include(a => a.Yorum)
                .Include(a => a.Puanlama)
                .Include(a => a.Liste)
                .Where(a => a.KullaniciId == id)
                .OrderByDescending(a => a.OlusturulmaZamani)
                .Skip((sayfa - 1) * limit)
                .Take(limit)
                .AsNoTracking()
                .ToListAsync();

            var response = aktiviteler.Select(a => new AktiviteDto
            {
                Id = a.Id,
                KullaniciId = a.KullaniciId,
                KullaniciAdi = a.Kullanici.KullaniciAdi,
                AvatarUrl = a.Kullanici.AvatarUrl,
                AktiviteTuru = a.AktiviteTuru.ToString(),
                IcerikId = a.IcerikId,
                IcerikBaslik = a.Icerik?.Baslik,
                PosterUrl = a.Icerik?.PosterUrl,
                YorumId = a.YorumId,
                PuanlamaId = a.PuanlamaId,
                Puan = a.Puanlama?.Puan,
                ListeId = a.ListeId,
                ListeAdi = a.Liste?.Ad,
                Veri = a.Veri,
                OlusturulmaZamani = a.OlusturulmaZamani
            }).ToList();

            return Ok(response);
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

        private async Task CreateTakipAktivite(Guid takipEdenId, Guid takipEdilenId)
        {
            var aktivite = new Aktivite
            {
                KullaniciId = takipEdenId,
                AktiviteTuru = AktiviteTuru.takip,
                Veri = System.Text.Json.JsonSerializer.Serialize(new { takipEdilenId }),
                OlusturulmaZamani = DateTime.UtcNow
            };

            _context.Aktiviteler.Add(aktivite);
            await _context.SaveChangesAsync();
        }
    }
}
