namespace Saga.Server.DTOs
{
    // Basit aktivite DTO (kullanıcı profili için)
    public class AktiviteDto
    {
        public long Id { get; set; }
        public Guid KullaniciId { get; set; }
        public string KullaniciAdi { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string AktiviteTuru { get; set; } = null!;
        public long? IcerikId { get; set; }
        public string? IcerikBaslik { get; set; }
        public string? PosterUrl { get; set; }
        public long? YorumId { get; set; }
        public long? PuanlamaId { get; set; }
        public decimal? Puan { get; set; }
        public long? ListeId { get; set; }
        public string? ListeAdi { get; set; }
        public string? Veri { get; set; }
        public DateTime OlusturulmaZamani { get; set; }
    }

    // Feed için aktivite item'ı
    public class AktiviteFeedDto
    {
        public long Id { get; set; }
        public Guid KullaniciId { get; set; }
        public string KullaniciAdi { get; set; } = null!;
        public string? KullaniciAvatar { get; set; }
        public string AktiviteTuru { get; set; } = null!; // puanlama, yorum, listeye_ekleme, takip, durum_guncelleme
        public long? IcerikId { get; set; }
        public string? IcerikTur { get; set; }
        public long? YorumId { get; set; } // Yorum aktivitesi için yorum ID'si
        public DateTime OlusturulmaZamani { get; set; }
        
        // İstatistikler
        public int BegeniSayisi { get; set; } = 0;
        public int YorumSayisi { get; set; } = 0;
        public int PaylasimSayisi { get; set; } = 0;
        public bool Begendim { get; set; } = false; // Kullanıcı bu aktiviteyi beğenmiş mi
        
        // Aktivite verileri (JSONB'den parse edilmiş)
        public AktiviteVeriDto? Veri { get; set; }
    }

    // Aktivite veri yapısı
    public class AktiviteVeriDto
    {
        // Ortak alanlar
        public string? Baslik { get; set; }
        public string? PosterUrl { get; set; }
        public string? Tur { get; set; }
        
        // Puanlama için
        public decimal? Puan { get; set; }
        
        // Yorum için
        public string? YorumOzet { get; set; }
        
        // Liste için
        public string? ListeAdi { get; set; }
        
        // Takip için
        public string? TakipEdilenKullaniciAdi { get; set; }
        public string? TakipEdilenAvatar { get; set; }
        
        // Durum güncelleme için
        public string? Durum { get; set; }
    }

    // Aktivite yanıtı
    public class AktiviteResponseDto
    {
        public long Id { get; set; }
        public Guid KullaniciId { get; set; }
        public string AktiviteTuru { get; set; } = null!;
        public long? IcerikId { get; set; }
        public long? PuanlamaId { get; set; }
        public long? YorumId { get; set; }
        public long? ListeId { get; set; }
        public string Veri { get; set; } = "{}";
        public DateTime OlusturulmaZamani { get; set; }
    }

    // Feed filtreleme için query params
    public class FeedFilterDto
    {
        public Guid? KullaniciId { get; set; } // Belirli bir kullanıcının aktiviteleri
        public string? AktiviteTuru { get; set; } // Belirli bir aktivite türü
        public bool SadeceTabipEdilenler { get; set; } = false; // Sadece takip edilenlerin aktiviteleri
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 20;
    }
    
    // Aktivite beğeni için
    public class AktiviteBegeniDto
    {
        public long AktiviteId { get; set; }
        public Guid KullaniciId { get; set; }
        public string KullaniciAdi { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public DateTime OlusturulmaZamani { get; set; }
    }
    
    // Aktivite yorumu için
    public class AktiviteYorumDto
    {
        public long Id { get; set; }
        public long AktiviteId { get; set; }
        public Guid KullaniciId { get; set; }
        public string KullaniciAdi { get; set; } = null!;
        public string? KullaniciAvatar { get; set; }
        public string Icerik { get; set; } = null!;
        public long? UstYorumId { get; set; }
        public int BegeniSayisi { get; set; } = 0;
        public bool Begendim { get; set; } = false;
        public DateTime OlusturulmaZamani { get; set; }
        public List<AktiviteYorumDto> Yanitlar { get; set; } = new();
    }
    
    // Aktivite yorum oluşturma
    public class AktiviteYorumOlusturDto
    {
        public string Icerik { get; set; } = null!;
        public long? UstYorumId { get; set; }
    }
}
