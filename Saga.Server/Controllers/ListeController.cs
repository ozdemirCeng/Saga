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
    public class ListeController : BaseApiController
    {
        private readonly SagaDbContext _context;
        private readonly ILogger<ListeController> _logger;

        public ListeController(SagaDbContext context, ILogger<ListeController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/liste
        // Kullanıcının kendi listelerini getir
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<List<ListeListDto>>> GetMyLists()
        {
            var kullaniciId = GetCurrentUserId();

            var listeler = await _context.Listeler
                .Include(l => l.Kullanici)
                .Where(l => l.KullaniciId == kullaniciId && !l.Silindi)
                .AsNoTracking()
                .OrderByDescending(l => l.GuncellemeZamani)
                .ToListAsync();

            var response = listeler.Select(l => new ListeListDto
            {
                Id = l.Id,
                KullaniciAdi = l.Kullanici.KullaniciAdi,
                Ad = l.Ad,
                Tur = l.Tur.ToString(),
                IcerikSayisi = l.IcerikSayisi,
                HerkeseAcik = l.HerkeseAcik,
                OlusturulmaZamani = l.OlusturulmaZamani
            }).ToList();

            return Ok(response);
        }

        // POST: api/liste
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ListeDetailDto>> CreateListe([FromBody] ListeCreateDto dto)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                // Tur string'ten enum'a çevir
                if (!Enum.TryParse<ListeTuru>(dto.Tur, true, out var listeTuru))
                {
                    return BadRequest(new { message = "Geçersiz liste türü. 'ozel' veya 'sistem' olmalıdır." });
                }

                var liste = new Liste
                {
                    KullaniciId = kullaniciId,
                    Ad = dto.Ad,
                    Tur = listeTuru,
                    Aciklama = dto.Aciklama,
                    HerkeseAcik = dto.HerkeseAcik,
                    OlusturulmaZamani = DateTime.UtcNow,
                    GuncellemeZamani = DateTime.UtcNow
                };

                _context.Listeler.Add(liste);
                await _context.SaveChangesAsync();

                // Aktivite kaydı
                    // TODO: Listeye ekleme aktiviteleri için DB tarafında trigger tanımlandığında C# tarafında manuel Aktivite oluşturma kaldırıldı.
                    // Şu anda sadece istatistikler güncelleniyor; feed ihtiyacı artarsa veritabaniyapisi'ne uygun bir trigger eklenmeli.

                var kullanici = await _context.Kullanicilar.FindAsync(kullaniciId);

                var response = new ListeDetailDto
                {
                    Id = liste.Id,
                    KullaniciId = liste.KullaniciId,
                    KullaniciAdi = kullanici?.KullaniciAdi ?? "",
                    Ad = liste.Ad,
                    Tur = liste.Tur.ToString(),
                    Aciklama = liste.Aciklama,
                    HerkeseAcik = liste.HerkeseAcik,
                    IcerikSayisi = 0,
                    OlusturulmaZamani = liste.OlusturulmaZamani,
                    GuncellemeZamani = liste.GuncellemeZamani,
                    Icerikler = new List<ListeIcerikItemDto>()
                };

                return CreatedAtAction(nameof(GetListe), new { id = liste.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Liste oluşturulurken hata");
                return StatusCode(500, new { message = "Liste kaydedilirken bir hata oluştu." });
            }
        }

        // GET: api/liste/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ListeDetailDto>> GetListe(long id)
        {
            var kullaniciId = GetCurrentUserIdOrNull();

            var liste = await _context.Listeler
                .Include(l => l.Kullanici)
                .Include(l => l.Icerikler)
                    .ThenInclude(li => li.Icerik)
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.Id == id && !l.Silindi);

            if (liste == null)
            {
                return NotFound(new { message = "Liste bulunamadı." });
            }

            // Yetki kontrolü: özel liste ise sadece sahibi görebilir
            if (!liste.HerkeseAcik && (!kullaniciId.HasValue || liste.KullaniciId != kullaniciId.Value))
            {
                return Forbid();
            }

            var response = new ListeDetailDto
            {
                Id = liste.Id,
                KullaniciId = liste.KullaniciId,
                KullaniciAdi = liste.Kullanici.KullaniciAdi,
                Ad = liste.Ad,
                Tur = liste.Tur.ToString(),
                Aciklama = liste.Aciklama,
                HerkeseAcik = liste.HerkeseAcik,
                IcerikSayisi = liste.IcerikSayisi,
                OlusturulmaZamani = liste.OlusturulmaZamani,
                GuncellemeZamani = liste.GuncellemeZamani,
                Icerikler = liste.Icerikler
                    .OrderBy(li => li.Sira)
                    .Select(li => new ListeIcerikItemDto
                    {
                        IcerikId = li.IcerikId,
                        Baslik = li.Icerik.Baslik,
                        Tur = li.Icerik.Tur.ToString(),
                        PosterUrl = li.Icerik.PosterUrl,
                        OrtalamaPuan = li.Icerik.OrtalamaPuan,
                        Sira = li.Sira,
                        NotMetni = li.NotMetni,
                        EklenmeZamani = li.EklenmeZamani
                    }).ToList()
            };

            return Ok(response);
        }

        // PUT: api/liste/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<ListeDetailDto>> UpdateListe(long id, [FromBody] ListeUpdateDto dto)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var liste = await _context.Listeler
                    .Include(l => l.Kullanici)
                    .Include(l => l.Icerikler)
                        .ThenInclude(li => li.Icerik)
                    .FirstOrDefaultAsync(l => l.Id == id && !l.Silindi);

                if (liste == null)
                {
                    return NotFound(new { message = "Liste bulunamadı." });
                }

                // Yetki kontrolü
                if (liste.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                liste.Ad = dto.Ad;
                liste.Aciklama = dto.Aciklama;
                liste.HerkeseAcik = dto.HerkeseAcik;
                liste.GuncellemeZamani = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var response = new ListeDetailDto
                {
                    Id = liste.Id,
                    KullaniciId = liste.KullaniciId,
                    KullaniciAdi = liste.Kullanici.KullaniciAdi,
                    Ad = liste.Ad,
                    Tur = liste.Tur.ToString(),
                    Aciklama = liste.Aciklama,
                    HerkeseAcik = liste.HerkeseAcik,
                    IcerikSayisi = liste.IcerikSayisi,
                    OlusturulmaZamani = liste.OlusturulmaZamani,
                    GuncellemeZamani = liste.GuncellemeZamani,
                    Icerikler = liste.Icerikler
                        .OrderBy(li => li.Sira)
                        .Select(li => new ListeIcerikItemDto
                        {
                            IcerikId = li.IcerikId,
                            Baslik = li.Icerik.Baslik,
                            Tur = li.Icerik.Tur.ToString(),
                            PosterUrl = li.Icerik.PosterUrl,
                            OrtalamaPuan = li.Icerik.OrtalamaPuan,
                            Sira = li.Sira,
                            NotMetni = li.NotMetni,
                            EklenmeZamani = li.EklenmeZamani
                        }).ToList()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Liste güncellenirken hata: {Id}", id);
                return StatusCode(500, new { message = "Liste güncellenirken bir hata oluştu." });
            }
        }

        // DELETE: api/liste/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteListe(long id)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var liste = await _context.Listeler
                    .FirstOrDefaultAsync(l => l.Id == id);

                if (liste == null)
                {
                    return NotFound(new { message = "Liste bulunamadı." });
                }

                // Yetki kontrolü
                if (liste.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                // Soft delete
                liste.Silindi = true;
                liste.GuncellemeZamani = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Liste silinirken hata: {Id}", id);
                return StatusCode(500, new { message = "Liste silinirken bir hata oluştu." });
            }
        }

        // GET: api/liste/kullanici/{kullaniciId}
        [HttpGet("kullanici/{kullaniciId}")]
        public async Task<ActionResult<List<ListeListDto>>> GetKullaniciListeleri(Guid kullaniciId)
        {
            var currentUserId = GetCurrentUserIdOrNull();

            var query = _context.Listeler
                .Include(l => l.Kullanici)
                .Where(l => l.KullaniciId == kullaniciId && !l.Silindi)
                .AsNoTracking();

            // Eğer başka kullanıcının listelerine bakılıyorsa, sadece herkese açık olanları göster
            if (!currentUserId.HasValue || currentUserId.Value != kullaniciId)
            {
                query = query.Where(l => l.HerkeseAcik);
            }

            var listeler = await query
                .OrderByDescending(l => l.GuncellemeZamani)
                .ToListAsync();

            var response = listeler.Select(l => new ListeListDto
            {
                Id = l.Id,
                KullaniciAdi = l.Kullanici.KullaniciAdi,
                Ad = l.Ad,
                Tur = l.Tur.ToString(),
                IcerikSayisi = l.IcerikSayisi,
                HerkeseAcik = l.HerkeseAcik,
                OlusturulmaZamani = l.OlusturulmaZamani
            }).ToList();

            return Ok(response);
        }

        // GET: api/liste/icerik/{icerikId}
        // Belirli bir içeriğin hangi listelerde olduğunu getir
        [HttpGet("icerik/{icerikId}")]
        [Authorize]
        public async Task<ActionResult<List<ListeListDto>>> GetIcerikListeleri(long icerikId)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                // Kullanıcının listelerinden bu içeriği içerenleri getir
                var listeler = await _context.Listeler
                    .Include(l => l.Kullanici)
                    .Include(l => l.Icerikler)
                    .Where(l => l.KullaniciId == kullaniciId && !l.Silindi && l.Icerikler.Any(li => li.IcerikId == icerikId))
                    .AsNoTracking()
                    .OrderByDescending(l => l.GuncellemeZamani)
                    .ToListAsync();

                var response = listeler.Select(l => new ListeListDto
                {
                    Id = l.Id,
                    KullaniciAdi = l.Kullanici.KullaniciAdi,
                    Ad = l.Ad,
                    Tur = l.Tur.ToString(),
                    IcerikSayisi = l.IcerikSayisi,
                    HerkeseAcik = l.HerkeseAcik,
                    OlusturulmaZamani = l.OlusturulmaZamani
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "İçerik listeleri getirilemedi: {IcerikId}", icerikId);
                return StatusCode(500, new { message = "İçerik listeleri getirilemedi." });
            }
        }

        // POST: api/liste/{id}/icerik
        [HttpPost("{id}/icerik")]
        [Authorize]
        public async Task<IActionResult> AddIcerikToListe(long id, [FromBody] ListeIcerikEkleDto dto)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var liste = await _context.Listeler
                    .Include(l => l.Icerikler)
                    .FirstOrDefaultAsync(l => l.Id == id && !l.Silindi);

                if (liste == null)
                {
                    return NotFound(new { message = "Liste bulunamadı." });
                }

                // Yetki kontrolü
                if (liste.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                // İçerik zaten listede mi? (AnyAsync ile optimize edildi)
                var icerikListedeMi = await _context.ListeIcerikleri
                    .AnyAsync(li => li.ListeId == id && li.IcerikId == dto.IcerikId);
                if (icerikListedeMi)
                {
                    return Conflict(new { message = "Bu içerik zaten listede mevcut." });
                }

                // İçerik var mı kontrol et
                var icerikVarMi = await _context.Icerikler.AnyAsync(i => i.Id == dto.IcerikId);
                if (!icerikVarMi)
                {
                    return NotFound(new { message = "İçerik bulunamadı." });
                }

                var listeIcerigi = new ListeIcerigi
                {
                    ListeId = id,
                    IcerikId = dto.IcerikId,
                    Sira = dto.Sira,
                    NotMetni = dto.NotMetni,
                    EklenmeZamani = DateTime.UtcNow
                };

                _context.ListeIcerikleri.Add(listeIcerigi);
                
                // İçerik sayısını artır
                liste.IcerikSayisi++;
                liste.GuncellemeZamani = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // NOT: Aktivite kaydı artık veritabanı trigger'ı (trg_akt_liste) tarafından yapılıyor.
                // Çifte kayıt sorununu önlemek için CreateListeIcerikAktivite çağrısı kaldırıldı.

                return Ok(new { message = "İçerik listeye eklendi.", icerikSayisi = liste.IcerikSayisi });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Listeye içerik eklenirken hata: {ListeId}, {IcerikId}", id, dto.IcerikId);
                return StatusCode(500, new { message = "İçerik eklenirken bir hata oluştu." });
            }
        }

        // PUT: api/liste/{id}/icerik/{icerikId}
        [HttpPut("{id}/icerik/{icerikId}")]
        [Authorize]
        public async Task<IActionResult> UpdateListeIcerik(long id, long icerikId, [FromBody] ListeIcerikGuncelleDto dto)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var liste = await _context.Listeler
                    .Include(l => l.Icerikler)
                    .FirstOrDefaultAsync(l => l.Id == id && !l.Silindi);

                if (liste == null)
                {
                    return NotFound(new { message = "Liste bulunamadı." });
                }

                // Yetki kontrolü
                if (liste.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                var listeIcerigi = liste.Icerikler.FirstOrDefault(li => li.IcerikId == icerikId);
                if (listeIcerigi == null)
                {
                    return NotFound(new { message = "İçerik listede bulunamadı." });
                }

                listeIcerigi.Sira = dto.Sira;
                listeIcerigi.NotMetni = dto.NotMetni;
                liste.GuncellemeZamani = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Liste içeriği güncellendi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Liste içeriği güncellenirken hata: {ListeId}, {IcerikId}", id, icerikId);
                return StatusCode(500, new { message = "Güncelleme sırasında bir hata oluştu." });
            }
        }

        // DELETE: api/liste/{id}/icerik/{icerikId}
        [HttpDelete("{id}/icerik/{icerikId}")]
        [Authorize]
        public async Task<IActionResult> RemoveIcerikFromListe(long id, long icerikId)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var liste = await _context.Listeler
                    .Include(l => l.Icerikler)
                    .FirstOrDefaultAsync(l => l.Id == id && !l.Silindi);

                if (liste == null)
                {
                    return NotFound(new { message = "Liste bulunamadı." });
                }

                // Yetki kontrolü
                if (liste.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                var listeIcerigi = liste.Icerikler.FirstOrDefault(li => li.IcerikId == icerikId);
                if (listeIcerigi == null)
                {
                    return NotFound(new { message = "İçerik listede bulunamadı." });
                }

                _context.ListeIcerikleri.Remove(listeIcerigi);
                
                // İçerik sayısını azalt
                liste.IcerikSayisi = Math.Max(0, liste.IcerikSayisi - 1);
                liste.GuncellemeZamani = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "İçerik listeden çıkarıldı.", icerikSayisi = liste.IcerikSayisi });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Listeden içerik çıkarılırken hata: {ListeId}, {IcerikId}", id, icerikId);
                return StatusCode(500, new { message = "İçerik çıkarılırken bir hata oluştu." });
            }
        }

        // POST: api/liste/{id}/paylas
        // Proje İsterleri 2.1.5: Liste paylaşım linki
        [HttpPost("{id}/paylas")]
        [Authorize]
        public async Task<ActionResult<ListePaylasildiDto>> GetShareLink(long id)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var liste = await _context.Listeler
                    .Include(l => l.Kullanici)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(l => l.Id == id && !l.Silindi);

                if (liste == null)
                {
                    return NotFound(new { message = "Liste bulunamadı." });
                }

                // Yetki kontrolü
                if (liste.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                // Listeyi herkese açık yap (paylaşım için gerekli)
                if (!liste.HerkeseAcik)
                {
                    var listeEntity = await _context.Listeler.FindAsync(id);
                    if (listeEntity != null)
                    {
                        listeEntity.HerkeseAcik = true;
                        listeEntity.GuncellemeZamani = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }

                // Paylaşım URL'i oluştur (frontend URL'i ile)
                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                var shareUrl = $"{baseUrl}/liste/{id}";

                var response = new ListePaylasildiDto
                {
                    ListeId = id,
                    ListeAdi = liste.Ad,
                    KullaniciAdi = liste.Kullanici.KullaniciAdi,
                    PaylasilmaUrl = shareUrl,
                    HerkeseAcik = true,
                    IcerikSayisi = liste.IcerikSayisi
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Liste paylaşılırken hata: {ListeId}", id);
                return StatusCode(500, new { message = "Paylaşım linki oluşturulurken bir hata oluştu." });
            }
        }

        // POST: api/liste/{id}/gizlilik
        // Proje İsterleri 2.1.5: Liste gizlilik ayarı toggle
        [HttpPost("{id}/gizlilik")]
        [Authorize]
        public async Task<IActionResult> TogglePrivacy(long id)
        {
            try
            {
                var kullaniciId = GetCurrentUserId();

                var liste = await _context.Listeler
                    .FirstOrDefaultAsync(l => l.Id == id && !l.Silindi);

                if (liste == null)
                {
                    return NotFound(new { message = "Liste bulunamadı." });
                }

                // Yetki kontrolü
                if (liste.KullaniciId != kullaniciId)
                {
                    return Forbid();
                }

                // Gizlilik ayarını değiştir
                liste.HerkeseAcik = !liste.HerkeseAcik;
                liste.GuncellemeZamani = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = liste.HerkeseAcik ? "Liste herkese açık yapıldı" : "Liste gizli yapıldı",
                    herkeseAcik = liste.HerkeseAcik
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Liste gizlilik ayarı değiştirilirken hata: {ListeId}", id);
                return StatusCode(500, new { message = "Gizlilik ayarı değiştirilirken bir hata oluştu." });
            }
        }

        // Helper Methods BaseApiController'dan gelmektedir.
        // CreateAktivite ve CreateListeIcerikAktivite metodları artık kullanılmıyor;
        // Liste aktiviteleri veritabanı trigger'ı (trg_akt_liste) ile oluşturuluyor.
    }
}
