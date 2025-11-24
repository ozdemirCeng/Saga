using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq; // JSON işlemek için
using Saga.Server.Data;
using Saga.Server.Models;

namespace Saga.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SeedController : ControllerBase
    {
        private readonly SagaDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;

        public SeedController(SagaDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
            _httpClient = new HttpClient();
        }

        [HttpPost("movies")]
        public async Task<IActionResult> SeedMovies()
        {
            
            string apiKey = _config["TmdbApiKey"] ?? "e3f2871d3e86f8742848979147d3d25d"; 
            string url = $"https://api.themoviedb.org/3/movie/popular?api_key={apiKey}&language=tr-TR&page=1";

            // 2. TMDb'den Veriyi Çek
            var response = await _httpClient.GetStringAsync(url);
            var json = JObject.Parse(response);
            var results = json["results"];

            if (results == null) return BadRequest("Veri çekilemedi.");

            int eklenenSayisi = 0;

            foreach (var item in results)
            {
                string hariciId = item["id"]?.ToString() ?? "";

                // Zaten ekli mi kontrol et?
                bool varMi = await _context.Icerikler.AnyAsync(x => x.HariciId == hariciId && x.ApiKaynagi == "tmdb");
                if (varMi) continue;

                // 3. Veriyi Bizim Modele Dönüştür
                var yeniFilm = new Icerik
                {
                    HariciId = hariciId,
                    ApiKaynagi = "tmdb",
                    Tur = "film",
                    Baslik = item["title"]?.ToString() ?? "Bilinmeyen Film",
                    Aciklama = item["overview"]?.ToString(),
                    PosterUrl = item["poster_path"] != null
                        ? $"https://image.tmdb.org/t/p/w500{item["poster_path"]}"
                        : null,
                    YayinTarihi = DateOnly.TryParse(item["release_date"]?.ToString(), out var date) ? date : null,
                    OrtalamaPuan = (decimal)(item["vote_average"]?.ToObject<double>() ?? 0),
                    PopulerlikSkoru = (decimal)(item["popularity"]?.ToObject<double>() ?? 0),
                    MetaVeri = item.ToString() // Tüm ham veriyi JSONB olarak sakla
                };

                _context.Icerikler.Add(yeniFilm);
                eklenenSayisi++;
            }

            // 4. Kaydet
            await _context.SaveChangesAsync();

            return Ok(new { message = $"{eklenenSayisi} adet film veritabanına eklendi!" });
        }
    }
}