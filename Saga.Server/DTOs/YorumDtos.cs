using System.ComponentModel.DataAnnotations;

namespace Saga.Server.DTOs
{
    // Yeni yorum oluşturma
    public class YorumCreateDto
    {
        [Required]
        public long IcerikId { get; set; }

        [MaxLength(255)]
        public string? Baslik { get; set; }

        [Required]
        [MaxLength(5000)]
        public string Icerik { get; set; } = null!;

        [Range(1.0, 10.0)]
        public decimal? Puan { get; set; }

        public bool SpoilerIceriyor { get; set; } = false;

        public long? UstYorumId { get; set; }
    }

    // Yorum güncelleme
    public class YorumUpdateDto
    {
        [MaxLength(255)]
        public string? Baslik { get; set; }

        [Required]
        [MaxLength(5000)]
        public string Icerik { get; set; } = null!;

        [Range(1.0, 10.0)]
        public decimal? Puan { get; set; }

        public bool SpoilerIceriyor { get; set; }
    }

    // Yorum yanıtı
    public class YorumResponseDto
    {
        public long Id { get; set; }
        public Guid KullaniciId { get; set; }
        public string KullaniciAdi { get; set; } = null!;
        public string? KullaniciAvatar { get; set; }
        public long IcerikId { get; set; }
        public string? Baslik { get; set; }
        public string Icerik { get; set; } = null!;
        public decimal? Puan { get; set; }
        public int BegeniSayisi { get; set; }
        public bool SpoilerIceriyor { get; set; }
        public DateTime OlusturulmaZamani { get; set; }
        public DateTime? GuncellemeZamani { get; set; }
        
        // Kullanıcı bu yorumu beğendi mi?
        public bool KullaniciBegendiMi { get; set; }

        public long? UstYorumId { get; set; }
        public List<YorumResponseDto> Yanitlar { get; set; } = new();
    }

    // Yorum listesi için hafif DTO
    public class YorumListDto
    {
        public long Id { get; set; }
        public Guid KullaniciId { get; set; } // Added
        public string KullaniciAdi { get; set; } = null!;
        public string? KullaniciAvatar { get; set; }
        public string? Baslik { get; set; }
        public string Icerik { get; set; } = null!; // Tam içerik
        public string IcerikOzet { get; set; } = null!; // İlk 150 karakter
        public decimal? Puan { get; set; }
        public int BegeniSayisi { get; set; }
        public bool KullaniciBegendiMi { get; set; } // Added
        public bool SpoilerIceriyor { get; set; }
        public DateTime OlusturulmaZamani { get; set; }

        public long? UstYorumId { get; set; }
        public List<YorumListDto> Yanitlar { get; set; } = new();
    }
}
