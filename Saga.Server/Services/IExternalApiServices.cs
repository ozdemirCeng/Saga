using Saga.Server.Models;

namespace Saga.Server.Services
{
    public interface ITmdbService
    {
        Task<TmdbFilmDto?> GetFilmByIdAsync(string tmdbId);
        Task<TmdbFilmDto?> GetTvShowByIdAsync(string tmdbId);
        Task<List<TmdbFilmDto>> SearchFilmsAsync(string query, int page = 1);
        Task<List<TmdbFilmDto>> SearchTvShowsAsync(string query, int page = 1);
        Task<List<TmdbFilmDto>> SearchMultiAsync(string query, int page = 1);
        Task<List<TmdbFilmDto>> GetPopularFilmsAsync(int page = 1);
        Task<List<TmdbFilmDto>> GetPopularTvShowsAsync(int page = 1);
        Task<List<TmdbFilmDto>> GetTopRatedFilmsAsync(int page = 1);
        Task<List<TmdbFilmDto>> GetTopRatedTvShowsAsync(int page = 1);
        Task<List<TmdbFilmDto>> GetNowPlayingFilmsAsync(int page = 1);
        Task<List<TmdbFilmDto>> GetOnTheAirTvShowsAsync(int page = 1);
        Task<List<TmdbFilmDto>> GetTrendingAsync(string mediaType = "all", string timeWindow = "week", int page = 1);
        Task<Icerik?> ImportFilmAsync(string tmdbId);
        Task<Icerik?> ImportTvShowAsync(string tmdbId);
    }

    public interface IGoogleBooksService
    {
        Task<GoogleBookDto?> GetBookByIdAsync(string googleBooksId);
        Task<List<GoogleBookDto>> SearchBooksAsync(string query, int startIndex = 0, int maxResults = 20, string? orderBy = null);
        Task<Icerik?> ImportBookAsync(string googleBooksId);
    }

    // TMDB Film/Dizi DTO
    public class TmdbFilmDto
    {
        public string Id { get; set; } = null!;
        public string Baslik { get; set; } = null!;
        public string? Aciklama { get; set; }
        public string? PosterUrl { get; set; }
        public string? ArkaplanUrl { get; set; }
        public string? YayinTarihi { get; set; }
        public double Puan { get; set; }
        public int OySayisi { get; set; }
        public string? OrijinalDil { get; set; }
        public List<int>? TurIds { get; set; }
        public List<string>? Turler { get; set; } // Tür adları
        public string? Yonetmen { get; set; }
        public List<OyuncuDto>? Oyuncular { get; set; }
        public int? Sure { get; set; } // Dakika cinsinden
        public int? SezonSayisi { get; set; } // Diziler için
        public int? BolumSayisi { get; set; } // Diziler için
        public string MediaType { get; set; } = "movie"; // movie veya tv
    }

    // Oyuncu DTO
    public class OyuncuDto
    {
        public string? HariciId { get; set; } // TMDB person ID
        public string Ad { get; set; } = null!;
        public string? Karakter { get; set; }
        public string? ProfilUrl { get; set; }
        public int Sira { get; set; } // Kredilerde sıralama
    }

    // Google Books DTO
    public class GoogleBookDto
    {
        public string Id { get; set; } = null!;
        public string Baslik { get; set; } = null!;
        public List<string>? Yazarlar { get; set; }
        public string? Aciklama { get; set; }
        public string? YayinTarihi { get; set; }
        public string? PosterUrl { get; set; }
        public string? Dil { get; set; }
        public int? SayfaSayisi { get; set; }
        public List<string>? Kategoriler { get; set; }
        public double? OrtalamaPuan { get; set; }
        public int? OySayisi { get; set; }
        public string? Yayinevi { get; set; }
        public string? ISBN { get; set; }
    }
}
