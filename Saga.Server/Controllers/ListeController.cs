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
    public class ListeController : ControllerBase
    {
        private readonly SagaDbContext _context;
        private readonly ILogger<ListeController> _logger;

        public ListeController(SagaDbContext context, ILogger<ListeController> logger)
        {
            _context = context;
            _logger = logger;
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
                await CreateAktivite(kullaniciId, liste.Id);

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

                // İçerik zaten listede mi?
                if (liste.Icerikler.Any(li => li.IcerikId == dto.IcerikId))
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

                // Aktivite kaydı
                await CreateListeIcerikAktivite(kullaniciId, id, dto.IcerikId);

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

        private async Task CreateAktivite(Guid kullaniciId, long listeId)
        {
            var aktivite = new Aktivite
            {
                KullaniciId = kullaniciId,
                AktiviteTuru = AktiviteTuru.listeye_ekleme,
                ListeId = listeId,
                OlusturulmaZamani = DateTime.UtcNow
            };

            _context.Aktiviteler.Add(aktivite);
            await _context.SaveChangesAsync();
        }

        private async Task CreateListeIcerikAktivite(Guid kullaniciId, long listeId, long icerikId)
        {
            var aktivite = new Aktivite
            {
                KullaniciId = kullaniciId,
                AktiviteTuru = AktiviteTuru.listeye_ekleme,
                ListeId = listeId,
                IcerikId = icerikId,
                OlusturulmaZamani = DateTime.UtcNow
            };

            _context.Aktiviteler.Add(aktivite);
            await _context.SaveChangesAsync();
        }
    }
}
