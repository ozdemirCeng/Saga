using Saga.Server.Models;

namespace Saga.Server.DTOs
{
    // Liste görünümü için hafif DTO
    public class IcerikListDto
    {
        public long Id { get; set; }
        public string Baslik { get; set; } = null!;
        public string Tur { get; set; } = null!;
        public string? Aciklama { get; set; }
        public string? PosterUrl { get; set; }
        public decimal OrtalamaPuan { get; set; } // Platform kullanıcı puanı
        public int PuanlamaSayisi { get; set; }
        public decimal HariciPuan { get; set; } // TMDB/IMDB puanı
        public int HariciOySayisi { get; set; }
        public decimal PopulerlikSkoru { get; set; }
        public DateOnly? YayinTarihi { get; set; }
    }

    // Detay sayfası için tam DTO
    public class IcerikDetailDto
    {
        public long Id { get; set; }
        public string HariciId { get; set; } = null!;
        public string ApiKaynagi { get; set; } = null!;
        public string Tur { get; set; } = null!;
        public string Baslik { get; set; } = null!;
        public string? Aciklama { get; set; }
        public string? PosterUrl { get; set; }
        public DateOnly? YayinTarihi { get; set; }
        public decimal OrtalamaPuan { get; set; } // Platform kullanıcı puanı
        public int PuanlamaSayisi { get; set; }
        public decimal HariciPuan { get; set; } // TMDB/IMDB puanı
        public int HariciOySayisi { get; set; }
        public int YorumSayisi { get; set; }
        public int ListeyeEklenmeSayisi { get; set; }
        public int GoruntulemeSayisi { get; set; }
        public decimal PopulerlikSkoru { get; set; }
        public DateTime OlusturulmaZamani { get; set; }
        
        // Kullanıcının bu içerikle ilişkisi (varsa)
        public decimal? KullaniciPuani { get; set; }
        public string? KullanicininDurumu { get; set; } // izlendi, izlenecek vs.
        
        // Film/Dizi için meta veriler
        public string? Yonetmen { get; set; }
        public List<OyuncuInfoDto>? Oyuncular { get; set; }
        public List<string>? Turler { get; set; }
        public int? Sure { get; set; } // Dakika
        public int? SezonSayisi { get; set; }
        public int? BolumSayisi { get; set; }
        
        // Kitap için meta veriler
        public List<string>? Yazarlar { get; set; }
        public int? SayfaSayisi { get; set; }
        public string? Yayinevi { get; set; }
        public string? ISBN { get; set; }
        public List<string>? Kategoriler { get; set; }
    }
    
    // Oyuncu bilgisi DTO (içerik detayında kullanılır)
    public class OyuncuInfoDto
    {
        public long? Id { get; set; } // Veritabanındaki ID (varsa)
        public string? HariciId { get; set; } // TMDB person ID
        public string Ad { get; set; } = null!;
        public string? Karakter { get; set; }
        public string? ProfilUrl { get; set; }
        public string? RolTipi { get; set; } // oyuncu, yonetmen, yapimci, senarist
    }
    
    // Oyuncu detay DTO (oyuncu sayfası için)
    public class OyuncuDetailDto
    {
        public long Id { get; set; }
        public string? HariciId { get; set; }
        public string Ad { get; set; } = null!;
        public string? ProfilUrl { get; set; }
        public string? Biyografi { get; set; }
        public DateOnly? DogumTarihi { get; set; }
        public string? DogumYeri { get; set; }
        public int? Cinsiyet { get; set; }
        public List<OyuncuFilmografiDto>? Filmografi { get; set; }
    }
    
    // Oyuncunun filmografisi için DTO
    public class OyuncuFilmografiDto
    {
        public long IcerikId { get; set; }
        public string Baslik { get; set; } = null!;
        public string? PosterUrl { get; set; }
        public string? Karakter { get; set; }
        public string Tur { get; set; } = null!;
        public DateOnly? YayinTarihi { get; set; }
        public decimal OrtalamaPuan { get; set; }
    }

    // Arama sonuçları için
    public class IcerikSearchDto
    {
        public long Id { get; set; }
        public string Baslik { get; set; } = null!;
        public string Tur { get; set; } = null!;
        public string? PosterUrl { get; set; }
        public decimal OrtalamaPuan { get; set; }
        public decimal HariciPuan { get; set; }
        public DateOnly? YayinTarihi { get; set; }
        public string? Aciklama { get; set; }
    }

    // Filtreleme için query parametreleri
    public class IcerikFilterDto
    {
        public string? Tur { get; set; } // film, kitap
        public string? Siralama { get; set; } // populerlik, puan, tarih
        public int? MinPuan { get; set; }
        public int? MinYil { get; set; }
        public int? MaxYil { get; set; }
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 20;
    }
}
