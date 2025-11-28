using Saga.Server.Data;
using Saga.Server.Models;
using System.Text.Json;

namespace Saga.Server.Services
{
    public class GoogleBooksService : IGoogleBooksService
    {
        private readonly HttpClient _httpClient;
        private readonly SagaDbContext _context;
        private readonly ILogger<GoogleBooksService> _logger;
        private readonly string _apiKey;
        private const string BaseUrl = "https://www.googleapis.com/books/v1";

        public GoogleBooksService(
            HttpClient httpClient,
            SagaDbContext context,
            ILogger<GoogleBooksService> logger,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _context = context;
            _logger = logger;
            _apiKey = configuration["GoogleBooks:ApiKey"] ?? "";
        }

        public async Task<GoogleBookDto?> GetBookByIdAsync(string googleBooksId)
        {
            try
            {
                var url = string.IsNullOrEmpty(_apiKey)
                    ? $"{BaseUrl}/volumes/{googleBooksId}"
                    : $"{BaseUrl}/volumes/{googleBooksId}?key={_apiKey}";

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Google Books API hatası: {StatusCode} - Book ID: {GoogleBooksId}", 
                        response.StatusCode, googleBooksId);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var bookData = JsonSerializer.Deserialize<JsonElement>(content);

                return ParseBookData(bookData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google Books kitap bilgisi alınırken hata: {GoogleBooksId}", googleBooksId);
                return null;
            }
        }

        public async Task<List<GoogleBookDto>> SearchBooksAsync(string query, int startIndex = 0, int maxResults = 20, string? orderBy = null)
        {
            const int maxRetries = 3;
            int retryCount = 0;
            
            while (retryCount < maxRetries)
            {
                try
                {
                    var encodedQuery = Uri.EscapeDataString(query);
                    // orderBy: relevance (varsayılan) veya newest
                    var order = string.IsNullOrEmpty(orderBy) ? "relevance" : orderBy;
                    var url = string.IsNullOrEmpty(_apiKey)
                        ? $"{BaseUrl}/volumes?q={encodedQuery}&startIndex={startIndex}&maxResults={maxResults}&orderBy={order}"
                        : $"{BaseUrl}/volumes?q={encodedQuery}&startIndex={startIndex}&maxResults={maxResults}&orderBy={order}&key={_apiKey}";

                    _logger.LogInformation("📚 Google Books API isteği: {Url}", url);

                    var response = await _httpClient.GetAsync(url);

                    // Rate limit (429) hatası - exponential backoff ile retry
                    if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                    {
                        retryCount++;
                        if (retryCount < maxRetries)
                        {
                            var delay = (int)Math.Pow(2, retryCount) * 1000; // 2s, 4s, 8s
                            _logger.LogWarning("Google Books rate limit, {RetryCount}. deneme, {Delay}ms bekleniyor...", retryCount, delay);
                            await Task.Delay(delay);
                            continue;
                        }
                        _logger.LogWarning("Google Books rate limit aşıldı, maksimum deneme sayısına ulaşıldı");
                        return new List<GoogleBookDto>();
                    }

                    if (!response.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("Google Books arama hatası: {StatusCode}", response.StatusCode);
                        return new List<GoogleBookDto>();
                    }

                    var content = await response.Content.ReadAsStringAsync();
                    var searchData = JsonSerializer.Deserialize<JsonElement>(content);

                    var results = new List<GoogleBookDto>();

                    if (searchData.TryGetProperty("items", out var itemsArray))
                    {
                        foreach (var item in itemsArray.EnumerateArray())
                        {
                            var bookDto = ParseBookData(item);
                            if (bookDto != null)
                            {
                                results.Add(bookDto);
                            }
                        }
                    }

                    return results;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Google Books araması sırasında hata: {Query}", query);
                    return new List<GoogleBookDto>();
                }
            }
            
            return new List<GoogleBookDto>();
        }

        public async Task<Icerik?> ImportBookAsync(string googleBooksId)
        {
            try
            {
                // Önce veritabanında var mı kontrol et
                var mevcutIcerik = _context.Icerikler
                    .FirstOrDefault(i => i.HariciId == googleBooksId && i.ApiKaynagi == ApiKaynak.google_books);

                if (mevcutIcerik != null)
                {
                    _logger.LogInformation("Kitap zaten mevcut: {GoogleBooksId}", googleBooksId);
                    return mevcutIcerik;
                }

                // Google Books'tan bilgileri al
                var bookDto = await GetBookByIdAsync(googleBooksId);
                if (bookDto == null)
                {
                    return null;
                }

                // Meta veriyi JSON olarak hazırla
                var metaVeri = new
                {
                    yazarlar = bookDto.Yazarlar,
                    sayfaSayisi = bookDto.SayfaSayisi,
                    kategoriler = bookDto.Kategoriler,
                    yayinevi = bookDto.Yayinevi,
                    isbn = bookDto.ISBN,
                    dil = bookDto.Dil
                };

                // Veritabanına kaydet
                var icerik = new Icerik
                {
                    HariciId = googleBooksId,
                    ApiKaynagi = ApiKaynak.google_books,
                    Tur = IcerikTuru.kitap,
                    Baslik = bookDto.Baslik,
                    Aciklama = bookDto.Aciklama,
                    PosterUrl = bookDto.PosterUrl,
                    YayinTarihi = ParseDateOnly(bookDto.YayinTarihi),
                    HariciPuan = bookDto.OrtalamaPuan.HasValue ? (decimal)(bookDto.OrtalamaPuan.Value * 2) : 0, // 5 üzerinden 10'a çevir
                    HariciOySayisi = bookDto.OySayisi ?? 0,
                    MetaVeri = JsonSerializer.Serialize(metaVeri),
                    OlusturulmaZamani = DateTime.UtcNow
                };

                _context.Icerikler.Add(icerik);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Kitap başarıyla import edildi: {Title} (Google Books ID: {GoogleBooksId})", 
                    icerik.Baslik, googleBooksId);
                return icerik;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kitap import edilirken hata: {GoogleBooksId}", googleBooksId);
                return null;
            }
        }

        private GoogleBookDto? ParseBookData(JsonElement bookData)
        {
            try
            {
                var id = bookData.GetProperty("id").GetString();
                if (string.IsNullOrEmpty(id))
                    return null;

                var volumeInfo = bookData.GetProperty("volumeInfo");

                var dto = new GoogleBookDto
                {
                    Id = id,
                    Baslik = volumeInfo.TryGetProperty("title", out var title) ? title.GetString() ?? "" : "",
                    Aciklama = volumeInfo.TryGetProperty("description", out var desc) ? desc.GetString() : null,
                    YayinTarihi = volumeInfo.TryGetProperty("publishedDate", out var date) ? date.GetString() : null,
                    Dil = volumeInfo.TryGetProperty("language", out var lang) ? lang.GetString() : null,
                    SayfaSayisi = volumeInfo.TryGetProperty("pageCount", out var pages) ? pages.GetInt32() : null
                };

                // Authors
                if (volumeInfo.TryGetProperty("authors", out var authors))
                {
                    dto.Yazarlar = new List<string>();
                    foreach (var author in authors.EnumerateArray())
                    {
                        var authorName = author.GetString();
                        if (!string.IsNullOrEmpty(authorName))
                        {
                            dto.Yazarlar.Add(authorName);
                        }
                    }
                }

                // Categories
                if (volumeInfo.TryGetProperty("categories", out var categories))
                {
                    dto.Kategoriler = new List<string>();
                    foreach (var category in categories.EnumerateArray())
                    {
                        var categoryName = category.GetString();
                        if (!string.IsNullOrEmpty(categoryName))
                        {
                            dto.Kategoriler.Add(categoryName);
                        }
                    }
                }

                // Image
                if (volumeInfo.TryGetProperty("imageLinks", out var imageLinks))
                {
                    if (imageLinks.TryGetProperty("thumbnail", out var thumbnail))
                    {
                        dto.PosterUrl = thumbnail.GetString();
                    }
                    else if (imageLinks.TryGetProperty("smallThumbnail", out var smallThumbnail))
                    {
                        dto.PosterUrl = smallThumbnail.GetString();
                    }
                }

                // Ratings
                dto.OrtalamaPuan = volumeInfo.TryGetProperty("averageRating", out var avgRating) 
                    ? avgRating.GetDouble() 
                    : null;
                dto.OySayisi = volumeInfo.TryGetProperty("ratingsCount", out var ratingsCount) 
                    ? ratingsCount.GetInt32() 
                    : null;

                // Yayınevi
                dto.Yayinevi = volumeInfo.TryGetProperty("publisher", out var publisher) 
                    ? publisher.GetString() 
                    : null;

                // ISBN
                if (volumeInfo.TryGetProperty("industryIdentifiers", out var identifiers))
                {
                    foreach (var identifier in identifiers.EnumerateArray())
                    {
                        if (identifier.TryGetProperty("type", out var type) && 
                            (type.GetString() == "ISBN_13" || type.GetString() == "ISBN_10"))
                        {
                            dto.ISBN = identifier.TryGetProperty("identifier", out var isbn) ? isbn.GetString() : null;
                            if (type.GetString() == "ISBN_13") break; // ISBN_13'ü tercih et
                        }
                    }
                }

                return dto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google Books veri parse edilirken hata");
                return null;
            }
        }

        private DateOnly? ParseDateOnly(string? dateString)
        {
            if (string.IsNullOrWhiteSpace(dateString))
                return null;

            // Google Books bazen sadece yıl döner (örn: "2020")
            if (dateString.Length == 4 && int.TryParse(dateString, out var year))
            {
                return new DateOnly(year, 1, 1);
            }

            // Tam tarih formatı
            if (DateOnly.TryParse(dateString, out var date))
                return date;

            // YYYY-MM formatı
            if (dateString.Length == 7 && dateString.Contains('-'))
            {
                var parts = dateString.Split('-');
                if (int.TryParse(parts[0], out var y) && int.TryParse(parts[1], out var m))
                {
                    return new DateOnly(y, m, 1);
                }
            }

            return null;
        }
    }
}
