using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saga.Server.Services;
using Saga.Server.DTOs;

namespace Saga.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExternalApiController : ControllerBase
    {
        private readonly ITmdbService _tmdbService;
        private readonly IGoogleBooksService _googleBooksService;
        private readonly ILogger<ExternalApiController> _logger;

        public ExternalApiController(
            ITmdbService tmdbService,
            IGoogleBooksService googleBooksService,
            ILogger<ExternalApiController> logger)
        {
            _tmdbService = tmdbService;
            _googleBooksService = googleBooksService;
            _logger = logger;
        }

        // GET: api/externalapi/tmdb/search?q={query}
        [HttpGet("tmdb/search")]
        [AllowAnonymous]
        public async Task<ActionResult<List<TmdbFilmDto>>> SearchTmdbFilms([FromQuery] string q, [FromQuery] int sayfa = 1)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest(new { message = "Arama terimi boş olamaz." });
            }

            var results = await _tmdbService.SearchFilmsAsync(q, sayfa);
            return Ok(results);
        }

        // GET: api/externalapi/tmdb/search-tv?q={query}
        [HttpGet("tmdb/search-tv")]
        [AllowAnonymous]
        public async Task<ActionResult<List<TmdbFilmDto>>> SearchTmdbTvShows([FromQuery] string q, [FromQuery] int sayfa = 1)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest(new { message = "Arama terimi boş olamaz." });
            }

            var results = await _tmdbService.SearchTvShowsAsync(q, sayfa);
            return Ok(results);
        }

        // GET: api/externalapi/tmdb/search-multi?q={query} (Film + Dizi birlikte)
        [HttpGet("tmdb/search-multi")]
        [AllowAnonymous]
        public async Task<ActionResult<List<TmdbFilmDto>>> SearchTmdbMulti([FromQuery] string q, [FromQuery] int sayfa = 1)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest(new { message = "Arama terimi boş olamaz." });
            }

            var results = await _tmdbService.SearchMultiAsync(q, sayfa);
            return Ok(results);
        }

        // GET: api/externalapi/tmdb/{id}
        [HttpGet("tmdb/{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<TmdbFilmDto>> GetTmdbFilm(string id)
        {
            var film = await _tmdbService.GetFilmByIdAsync(id);
            if (film == null)
            {
                return NotFound(new { message = "Film bulunamadı." });
            }

            return Ok(film);
        }

        // GET: api/externalapi/tmdb/tv/{id}
        [HttpGet("tmdb/tv/{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<TmdbFilmDto>> GetTmdbTvShow(string id)
        {
            var tvShow = await _tmdbService.GetTvShowByIdAsync(id);
            if (tvShow == null)
            {
                return NotFound(new { message = "Dizi bulunamadı." });
            }

            return Ok(tvShow);
        }

        // GET: api/externalapi/tmdb/popular
        [HttpGet("tmdb/popular")]
        [AllowAnonymous]
        public async Task<ActionResult<List<TmdbFilmDto>>> GetPopularTmdbFilms([FromQuery] int sayfa = 1)
        {
            var films = await _tmdbService.GetPopularFilmsAsync(sayfa);
            return Ok(films);
        }

        // GET: api/externalapi/tmdb/popular-tv
        [HttpGet("tmdb/popular-tv")]
        [AllowAnonymous]
        public async Task<ActionResult<List<TmdbFilmDto>>> GetPopularTmdbTvShows([FromQuery] int sayfa = 1)
        {
            var shows = await _tmdbService.GetPopularTvShowsAsync(sayfa);
            return Ok(shows);
        }

        // GET: api/externalapi/tmdb/top-rated
        [HttpGet("tmdb/top-rated")]
        [AllowAnonymous]
        public async Task<ActionResult<List<TmdbFilmDto>>> GetTopRatedTmdbFilms([FromQuery] int sayfa = 1)
        {
            var films = await _tmdbService.GetTopRatedFilmsAsync(sayfa);
            return Ok(films);
        }

        // GET: api/externalapi/tmdb/top-rated-tv
        [HttpGet("tmdb/top-rated-tv")]
        [AllowAnonymous]
        public async Task<ActionResult<List<TmdbFilmDto>>> GetTopRatedTmdbTvShows([FromQuery] int sayfa = 1)
        {
            var shows = await _tmdbService.GetTopRatedTvShowsAsync(sayfa);
            return Ok(shows);
        }

        // GET: api/externalapi/tmdb/now-playing (Vizyondakiler)
        [HttpGet("tmdb/now-playing")]
        [AllowAnonymous]
        public async Task<ActionResult<List<TmdbFilmDto>>> GetNowPlayingTmdbFilms([FromQuery] int sayfa = 1)
        {
            var films = await _tmdbService.GetNowPlayingFilmsAsync(sayfa);
            return Ok(films);
        }

        // GET: api/externalapi/tmdb/on-the-air (Yayındaki Diziler)
        [HttpGet("tmdb/on-the-air")]
        [AllowAnonymous]
        public async Task<ActionResult<List<TmdbFilmDto>>> GetOnTheAirTmdbTvShows([FromQuery] int sayfa = 1)
        {
            var shows = await _tmdbService.GetOnTheAirTvShowsAsync(sayfa);
            return Ok(shows);
        }

        // GET: api/externalapi/tmdb/trending (Trendler)
        [HttpGet("tmdb/trending")]
        [AllowAnonymous]
        public async Task<ActionResult<List<TmdbFilmDto>>> GetTrendingTmdb(
            [FromQuery] string mediaType = "all", 
            [FromQuery] string timeWindow = "week",
            [FromQuery] int sayfa = 1)
        {
            var results = await _tmdbService.GetTrendingAsync(mediaType, timeWindow, sayfa);
            return Ok(results);
        }

        // POST: api/externalapi/tmdb/import/{tmdbId}
        [HttpPost("tmdb/import/{tmdbId}")]
        [AllowAnonymous] // Geçici olarak herkes içerik ekleyebilir (test için)
        public async Task<ActionResult<IcerikDetailDto>> ImportTmdbFilm(string tmdbId)
        {
            try
            {
                var icerik = await _tmdbService.ImportFilmAsync(tmdbId);
                if (icerik == null)
                {
                    return BadRequest(new { message = "Film import edilemedi." });
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
                    YorumSayisi = 0,
                    ListeyeEklenmeSayisi = 0,
                    GoruntulemeSayisi = icerik.GoruntulemeSayisi,
                    PopulerlikSkoru = icerik.PopulerlikSkoru,
                    OlusturulmaZamani = icerik.OlusturulmaZamani
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "TMDB film import hatası: {TmdbId}", tmdbId);
                return StatusCode(500, new { message = "Film import edilirken bir hata oluştu." });
            }
        }

        // POST: api/externalapi/tmdb/import-tv/{tmdbId}
        [HttpPost("tmdb/import-tv/{tmdbId}")]
        [AllowAnonymous] // Geçici olarak herkes içerik ekleyebilir (test için)
        public async Task<ActionResult<IcerikDetailDto>> ImportTmdbTvShow(string tmdbId)
        {
            try
            {
                var icerik = await _tmdbService.ImportTvShowAsync(tmdbId);
                if (icerik == null)
                {
                    return BadRequest(new { message = "Dizi import edilemedi." });
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
                    YorumSayisi = 0,
                    ListeyeEklenmeSayisi = 0,
                    GoruntulemeSayisi = icerik.GoruntulemeSayisi,
                    PopulerlikSkoru = icerik.PopulerlikSkoru,
                    OlusturulmaZamani = icerik.OlusturulmaZamani
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "TMDB dizi import hatası: {TmdbId}", tmdbId);
                return StatusCode(500, new { message = "Dizi import edilirken bir hata oluştu." });
            }
        }

        // GET: api/externalapi/books/search?q={query}&langRestrict={lang}&filter={filter}
        [HttpGet("books/search")]
        [AllowAnonymous]
        public async Task<ActionResult<GoogleBooksSearchResult>> SearchGoogleBooks(
            [FromQuery] string q, 
            [FromQuery] int baslangic = 0,
            [FromQuery] int limit = 40,
            [FromQuery] string? orderBy = null,
            [FromQuery] string? langRestrict = null,
            [FromQuery] string? filter = null)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest(new { message = "Arama terimi boş olamaz." });
            }

            var result = await _googleBooksService.SearchBooksAsync(q, baslangic, limit, orderBy, langRestrict, filter);
            return Ok(result);
        }

        // GET: api/externalapi/books/{id}
        [HttpGet("books/{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<GoogleBookDto>> GetGoogleBook(string id)
        {
            var book = await _googleBooksService.GetBookByIdAsync(id);
            if (book == null)
            {
                return NotFound(new { message = "Kitap bulunamadı." });
            }

            return Ok(book);
        }

        // POST: api/externalapi/books/import/{googleBooksId}
        [HttpPost("books/import/{googleBooksId}")]
        [AllowAnonymous] // Geçici olarak herkes içerik ekleyebilir (test için)
        public async Task<ActionResult<IcerikDetailDto>> ImportGoogleBook(string googleBooksId)
        {
            try
            {
                var icerik = await _googleBooksService.ImportBookAsync(googleBooksId);
                if (icerik == null)
                {
                    return BadRequest(new { message = "Kitap import edilemedi." });
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
                    YorumSayisi = 0,
                    ListeyeEklenmeSayisi = 0,
                    GoruntulemeSayisi = icerik.GoruntulemeSayisi,
                    PopulerlikSkoru = icerik.PopulerlikSkoru,
                    OlusturulmaZamani = icerik.OlusturulmaZamani
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google Books import hatası: {GoogleBooksId}", googleBooksId);
                return StatusCode(500, new { message = "Kitap import edilirken bir hata oluştu." });
            }
        }

        // POST: api/externalapi/tmdb/bulk-import
        [HttpPost("tmdb/bulk-import")]
        [Authorize(Roles = "yonetici,moderator")]
        public async Task<ActionResult> BulkImportTmdbFilms([FromBody] List<string> tmdbIds)
        {
            var imported = 0;
            var failed = 0;

            foreach (var tmdbId in tmdbIds)
            {
                try
                {
                    var result = await _tmdbService.ImportFilmAsync(tmdbId);
                    if (result != null)
                    {
                        imported++;
                    }
                    else
                    {
                        failed++;
                    }
                }
                catch
                {
                    failed++;
                }

                // Rate limiting için küçük bekleme
                await Task.Delay(100);
            }

            return Ok(new
            {
                message = "Toplu import tamamlandı",
                toplam = tmdbIds.Count,
                basarili = imported,
                basarisiz = failed
            });
        }

        // POST: api/externalapi/books/bulk-import
        [HttpPost("books/bulk-import")]
        [Authorize(Roles = "yonetici,moderator")]
        public async Task<ActionResult> BulkImportGoogleBooks([FromBody] List<string> googleBooksIds)
        {
            var imported = 0;
            var failed = 0;

            foreach (var bookId in googleBooksIds)
            {
                try
                {
                    var result = await _googleBooksService.ImportBookAsync(bookId);
                    if (result != null)
                    {
                        imported++;
                    }
                    else
                    {
                        failed++;
                    }
                }
                catch
                {
                    failed++;
                }

                // Rate limiting için küçük bekleme
                await Task.Delay(100);
            }

            return Ok(new
            {
                message = "Toplu import tamamlandı",
                toplam = googleBooksIds.Count,
                basarili = imported,
                basarisiz = failed
            });
        }

    }
}
