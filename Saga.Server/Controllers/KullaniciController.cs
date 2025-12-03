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
    public class KullaniciController : BaseApiController
    {
        private readonly SagaDbContext _context;
        private readonly ILogger<KullaniciController> _logger;

        public KullaniciController(SagaDbContext context, ILogger<KullaniciController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/kullanici/profil (Kendi profilim)
        [HttpGet("profil")]
        [Authorize]
        public async Task<ActionResult<ProfilDto>> GetMyProfil()
        {
            var kullaniciId = GetCurrentUserId();
            return await GetProfil(kullaniciId);
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

                // Sadece gönderilen değerleri güncelle, boş string'leri yoksay
                if (!string.IsNullOrWhiteSpace(dto.GoruntulemeAdi))
                    kullanici.GoruntulemeAdi = dto.GoruntulemeAdi;
                if (!string.IsNullOrWhiteSpace(dto.Biyografi))
                    kullanici.Biyografi = dto.Biyografi;
                if (!string.IsNullOrWhiteSpace(dto.AvatarUrl))
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

                    // NOT: Aktivite kaydı artık veritabanı trigger'ı (trg_akt_takip) tarafından yapılıyor.
                    // Çifte kayıt sorununu önlemek için CreateTakipAktivite çağrısı kaldırıldı.

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

        // GET: api/kullanici/id/{id} - ID'ye göre kullanıcı getir
        [HttpGet("id/{id}")]
        public async Task<ActionResult<ProfilDto>> GetKullaniciById(Guid id)
        {
            return await GetProfil(id);
        }

        // GET: api/kullanici/username/{kullaniciAdi} - Kullanıcı adına göre profil
        [HttpGet("username/{kullaniciAdi}")]
        public async Task<ActionResult<ProfilDto>> GetKullaniciByUsername(string kullaniciAdi)
        {
            var kullanici = await _context.Kullanicilar
                .AsNoTracking()
                .FirstOrDefaultAsync(k => k.KullaniciAdi == kullaniciAdi && !k.Silindi);

            if (kullanici == null)
            {
                return NotFound(new { message = "Kullanıcı bulunamadı." });
            }

            return await GetProfil(kullanici.Id);
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
        // Proje İsterler 2.1.5: Kullanıcının son aktiviteleri (filtreli)
        [HttpGet("{id}/aktiviteler")]
        public async Task<ActionResult<List<AktiviteDto>>> GetKullaniciAktiviteleri(
            Guid id,
            [FromQuery] string? aktiviteTuru = null,
            [FromQuery] DateTime? baslangic = null,
            [FromQuery] DateTime? bitis = null,
            [FromQuery] int sayfa = 1,
            [FromQuery] int limit = 20)
        {
            var query = _context.Aktiviteler
                .Include(a => a.Kullanici)
                .Include(a => a.Icerik)
                .Include(a => a.Yorum)
                .Include(a => a.Puanlama)
                .Include(a => a.Liste)
                .Where(a => a.KullaniciId == id)
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

            var aktiviteler = await query
                .OrderByDescending(a => a.OlusturulmaZamani)
                .Skip((sayfa - 1) * limit)
                .Take(limit)
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

        // CreateTakipAktivite metodu artık kullanılmıyor; takip aktiviteleri veritabanı trigger'ı (trg_akt_takip) ile oluşturuluyor.
        // private async Task CreateTakipAktivite(Guid takipEdenId, Guid takipEdilenId)
        // {
        //     var aktivite = new Aktivite
        //     {
        //         KullaniciId = takipEdenId,
        //         AktiviteTuru = AktiviteTuru.takip,
        //         Veri = System.Text.Json.JsonSerializer.Serialize(new { takipEdilenId }),
        //         OlusturulmaZamani = DateTime.UtcNow
        //     };
        //     _context.Aktiviteler.Add(aktivite);
        //     await _context.SaveChangesAsync();
        // }

        // DELETE: api/kullanici/hesap
        // Kullanıcı hesabını kalıcı olarak siler
        [HttpDelete("hesap")]
        [Authorize]
        public async Task<IActionResult> DeleteAccount()
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

                // Soft delete - sadece silindi olarak işaretle
                // İlişkili tüm veriler de soft delete yapılacak
                kullanici.Silindi = true;
                kullanici.GuncellemeZamani = DateTime.UtcNow;
                kullanici.Aktif = false;

                // İlişkili verileri de soft delete yap
                await _context.Aktiviteler
                    .Where(a => a.KullaniciId == kullaniciId)
                    .ExecuteUpdateAsync(a => a.SetProperty(x => x.Silindi, true));

                await _context.Yorumlar
                    .Where(y => y.KullaniciId == kullaniciId)
                    .ExecuteUpdateAsync(y => y.SetProperty(x => x.Silindi, true));

                await _context.Puanlamalar
                    .Where(p => p.KullaniciId == kullaniciId)
                    .ExecuteUpdateAsync(p => p.SetProperty(x => x.Silindi, true));

                await _context.Listeler
                    .Where(l => l.KullaniciId == kullaniciId)
                    .ExecuteUpdateAsync(l => l.SetProperty(x => x.Silindi, true));

                await _context.KutuphaneDurumlari
                    .Where(k => k.KullaniciId == kullaniciId)
                    .ExecuteUpdateAsync(k => k.SetProperty(x => x.Silindi, true));

                // Takipleri sil (hard delete)
                await _context.Takipler
                    .Where(t => t.TakipEdenId == kullaniciId || t.TakipEdilenId == kullaniciId)
                    .ExecuteDeleteAsync();

                await _context.SaveChangesAsync();

                _logger.LogInformation("Kullanıcı hesabı silindi: {KullaniciId}", kullaniciId);

                return Ok(new { message = "Hesabınız başarıyla silindi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hesap silinirken hata: {KullaniciId}", GetCurrentUserId());
                return StatusCode(500, new { message = "Hesap silinirken bir hata oluştu." });
            }
        }

        // GET: api/kullanici/onerilen
        // Akıllı Öneri Sistemi: Benzer içerik türleriyle ilgilenen kullanıcıları öner
        // Algoritma: Kullanıcının kütüphanesindeki içerik türlerini (film/kitap) analiz et
        // ve aynı türlerle ilgilenen, henüz takip etmediği kullanıcıları öner
        [HttpGet("onerilen")]
        public async Task<ActionResult<List<OnerilenKullaniciDto>>> GetOnerilenKullanicilar([FromQuery] int limit = 5)
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrNull();

                // Takip edilen kullanıcı ID'leri (giriş yapmışsa)
                var takipEdilenIds = currentUserId.HasValue
                    ? await _context.Takipler
                        .Where(t => t.TakipEdenId == currentUserId.Value)
                        .Select(t => t.TakipEdilenId)
                        .ToListAsync()
                    : new List<Guid>();

                // Eğer kullanıcı giriş yapmışsa, akıllı öneri yap
                if (currentUserId.HasValue)
                {
                    // Kullanıcının kütüphanesindeki içerik ID'lerini al
                    var kullaniciKutuphaneIcerikleri = await _context.KutuphaneDurumlari
                        .Where(k => k.KullaniciId == currentUserId.Value && !k.Silindi)
                        .Select(k => k.IcerikId)
                        .ToListAsync();

                    // Kullanıcının ilgilendiği içerik türlerini bul (film mi kitap mı)
                    var kullaniciIcerikTurleri = await _context.KutuphaneDurumlari
                        .Include(k => k.Icerik)
                        .Where(k => k.KullaniciId == currentUserId.Value && !k.Silindi)
                        .Select(k => k.Icerik.Tur)
                        .Distinct()
                        .ToListAsync();

                    // Kullanıcının puanladığı içeriklerin ID'leri
                    var puanladigiIcerikler = await _context.Puanlamalar
                        .Where(p => p.KullaniciId == currentUserId.Value && !p.Silindi)
                        .Select(p => p.IcerikId)
                        .ToListAsync();

                    // Benzer içeriklerle ilgilenen kullanıcıları bul
                    var ortakIcerikKullanicilari = await _context.KutuphaneDurumlari
                        .Where(k => !k.Silindi &&
                                    k.KullaniciId != currentUserId.Value &&
                                    !takipEdilenIds.Contains(k.KullaniciId) &&
                                    (kullaniciKutuphaneIcerikleri.Contains(k.IcerikId) ||
                                     puanladigiIcerikler.Contains(k.IcerikId)))
                        .GroupBy(k => k.KullaniciId)
                        .Select(g => new
                        {
                            KullaniciId = g.Key,
                            OrtakIcerikSayisi = g.Count()
                        })
                        .OrderByDescending(x => x.OrtakIcerikSayisi)
                        .Take(limit * 2) // Daha fazla aday al
                        .ToListAsync();

                    // Aynı içerik türleriyle ilgilenen kullanıcıları bul
                    var benzerTurKullanicilari = await _context.KutuphaneDurumlari
                        .Include(k => k.Icerik)
                        .Where(k => !k.Silindi &&
                                    k.KullaniciId != currentUserId.Value &&
                                    !takipEdilenIds.Contains(k.KullaniciId) &&
                                    kullaniciIcerikTurleri.Contains(k.Icerik.Tur))
                        .GroupBy(k => k.KullaniciId)
                        .Select(g => new
                        {
                            KullaniciId = g.Key,
                            BenzerTurSayisi = g.Count()
                        })
                        .ToListAsync();

                    // Skorları birleştir
                    var tumAdaylar = ortakIcerikKullanicilari
                        .Select(x => new
                        {
                            x.KullaniciId,
                            Skor = x.OrtakIcerikSayisi * 3 // Ortak içerik 3x ağırlık
                        })
                        .Concat(benzerTurKullanicilari.Select(x => new
                        {
                            x.KullaniciId,
                            Skor = x.BenzerTurSayisi // Benzer tür 1x ağırlık
                        }))
                        .GroupBy(x => x.KullaniciId)
                        .Select(g => new
                        {
                            KullaniciId = g.Key,
                            ToplamSkor = g.Sum(x => x.Skor)
                        })
                        .OrderByDescending(x => x.ToplamSkor)
                        .Take(limit)
                        .Select(x => x.KullaniciId)
                        .ToList();

                    if (tumAdaylar.Any())
                    {
                        var onerilenler = await _context.Kullanicilar
                            .Where(k => tumAdaylar.Contains(k.Id) && !k.Silindi && k.Aktif)
                            .Select(k => new
                            {
                                Kullanici = k,
                                TakipciSayisi = _context.Takipler.Count(t => t.TakipEdilenId == k.Id),
                                PuanlamaSayisi = _context.Puanlamalar.Count(p => p.KullaniciId == k.Id && !p.Silindi),
                                OrtakIcerik = _context.KutuphaneDurumlari.Count(kd =>
                                    kd.KullaniciId == k.Id && !kd.Silindi &&
                                    (kullaniciKutuphaneIcerikleri.Contains(kd.IcerikId) ||
                                     puanladigiIcerikler.Contains(kd.IcerikId))),
                                // Ortak içerik türlerini bul
                                FilmIlgisi = _context.KutuphaneDurumlari.Any(kd =>
                                    kd.KullaniciId == k.Id && !kd.Silindi && kd.Icerik.Tur == IcerikTuru.film),
                                KitapIlgisi = _context.KutuphaneDurumlari.Any(kd =>
                                    kd.KullaniciId == k.Id && !kd.Silindi && kd.Icerik.Tur == IcerikTuru.kitap)
                            })
                            .ToListAsync();

                        // Skorlara göre sırala
                        var result = onerilenler
                            .Select(x => new OnerilenKullaniciDto
                            {
                                Id = x.Kullanici.Id,
                                KullaniciAdi = x.Kullanici.KullaniciAdi,
                                GoruntulemeAdi = x.Kullanici.GoruntulemeAdi,
                                AvatarUrl = x.Kullanici.AvatarUrl,
                                TakipEdenSayisi = x.TakipciSayisi,
                                ToplamPuanlama = x.PuanlamaSayisi,
                                OrtakIcerikSayisi = x.OrtakIcerik,
                                OneriNedeni = x.OrtakIcerik > 0
                                    ? $"{x.OrtakIcerik} ortak içerik"
                                    : (x.FilmIlgisi && x.KitapIlgisi ? "Film ve kitap ilgisi"
                                        : x.FilmIlgisi ? "Film ilgisi"
                                        : x.KitapIlgisi ? "Kitap ilgisi"
                                        : "Aktif kullanıcı")
                            })
                            .OrderByDescending(x => x.OrtakIcerikSayisi)
                            .ThenByDescending(x => x.TakipEdenSayisi)
                            .Take(limit)
                            .ToList();

                        return Ok(result);
                    }
                }

                // Fallback: Giriş yapmamış veya yeterli veri yoksa, en aktif kullanıcıları göster
                var query = _context.Kullanicilar
                    .Where(k => !k.Silindi && k.Aktif);

                if (currentUserId.HasValue)
                {
                    query = query.Where(k => k.Id != currentUserId.Value && !takipEdilenIds.Contains(k.Id));
                }

                var kullanicilar = await query
                    .Select(k => new
                    {
                        Kullanici = k,
                        PuanlamaSayisi = _context.Puanlamalar.Count(p => p.KullaniciId == k.Id && !p.Silindi),
                        TakipciSayisi = _context.Takipler.Count(t => t.TakipEdilenId == k.Id)
                    })
                    .OrderByDescending(x => x.TakipciSayisi)
                    .ThenByDescending(x => x.PuanlamaSayisi)
                    .Take(limit)
                    .ToListAsync();

                var fallbackResult = kullanicilar.Select(x => new OnerilenKullaniciDto
                {
                    Id = x.Kullanici.Id,
                    KullaniciAdi = x.Kullanici.KullaniciAdi,
                    GoruntulemeAdi = x.Kullanici.GoruntulemeAdi,
                    AvatarUrl = x.Kullanici.AvatarUrl,
                    TakipEdenSayisi = x.TakipciSayisi,
                    ToplamPuanlama = x.PuanlamaSayisi,
                    OrtakIcerikSayisi = 0,
                    OneriNedeni = "Popüler kullanıcı"
                }).ToList();

                return Ok(fallbackResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Önerilen kullanıcılar alınırken hata");
                return StatusCode(500, new { message = "Önerilen kullanıcılar yüklenirken bir hata oluştu." });
            }
        }

        // GET: api/kullanici/populer
        // En popüler kullanıcıları getir (en çok takipçili)
        [HttpGet("populer")]
        public async Task<ActionResult<List<KullaniciListDto>>> GetPopulerKullanicilar([FromQuery] int limit = 10)
        {
            try
            {
                var kullanicilar = await _context.Kullanicilar
                    .Where(k => !k.Silindi && k.Aktif)
                    .Select(k => new
                    {
                        Kullanici = k,
                        TakipciSayisi = _context.Takipler.Count(t => t.TakipEdilenId == k.Id),
                        PuanlamaSayisi = _context.Puanlamalar.Count(p => p.KullaniciId == k.Id && !p.Silindi)
                    })
                    .OrderByDescending(x => x.TakipciSayisi)
                    .ThenByDescending(x => x.PuanlamaSayisi)
                    .Take(limit)
                    .ToListAsync();

                var result = kullanicilar.Select(x => new KullaniciListDto
                {
                    Id = x.Kullanici.Id,
                    KullaniciAdi = x.Kullanici.KullaniciAdi,
                    GoruntulemeAdi = x.Kullanici.GoruntulemeAdi,
                    AvatarUrl = x.Kullanici.AvatarUrl,
                    TakipEdenSayisi = x.TakipciSayisi,
                    ToplamPuanlama = x.PuanlamaSayisi
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Popüler kullanıcılar alınırken hata");
                return StatusCode(500, new { message = "Popüler kullanıcılar yüklenirken bir hata oluştu." });
            }
        }
    }
}
