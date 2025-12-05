using System.ComponentModel.DataAnnotations;

namespace Saga.Server.DTOs
{
    // Yeni liste oluşturma
    public class ListeCreateDto
    {
        [Required]
        [MaxLength(200)]
        public string Ad { get; set; } = null!;

        public string? Aciklama { get; set; }

        public bool HerkeseAcik { get; set; } = true;

        // "sistem" veya "ozel"
        public string Tur { get; set; } = "ozel";
    }

    // Liste güncelleme
    public class ListeUpdateDto
    {
        [Required]
        [MaxLength(200)]
        public string Ad { get; set; } = null!;

        public string? Aciklama { get; set; }

        public bool HerkeseAcik { get; set; }
    }

    // Liste detayı (içerikleriyle birlikte)
    public class ListeDetailDto
    {
        public long Id { get; set; }
        public Guid KullaniciId { get; set; }
        public string KullaniciAdi { get; set; } = null!;
        public string Ad { get; set; } = null!;
        public string Tur { get; set; } = null!;
        public string? Aciklama { get; set; }
        public bool HerkeseAcik { get; set; }
        public int IcerikSayisi { get; set; }
        public DateTime OlusturulmaZamani { get; set; }
        public DateTime GuncellemeZamani { get; set; }
        
        // Liste içindeki içerikler
        public List<ListeIcerikItemDto> Icerikler { get; set; } = new();
    }

    // Listedeki içerik itemi
    public class ListeIcerikItemDto
    {
        public long IcerikId { get; set; }
        public string Baslik { get; set; } = null!;
        public string Tur { get; set; } = null!;
        public string? PosterUrl { get; set; }
        public decimal OrtalamaPuan { get; set; }
        public int Sira { get; set; }
        public string? NotMetni { get; set; }
        public DateTime EklenmeZamani { get; set; }
    }

    // Liste listesi için hafif DTO
    public class ListeListDto
    {
        public long Id { get; set; }
        public string KullaniciAdi { get; set; } = null!;
        public string Ad { get; set; } = null!;
        public string? Aciklama { get; set; }
        public string Tur { get; set; } = null!;
        public int IcerikSayisi { get; set; }
        public bool HerkeseAcik { get; set; }
        public DateTime OlusturulmaZamani { get; set; }
        // İlk 4 içeriğin posteri için
        public List<ListeOnizlemePoster> Posterler { get; set; } = new();
    }

    // Poster önizlemesi için minimal DTO
    public class ListeOnizlemePoster
    {
        public string? PosterUrl { get; set; }
        public string Tur { get; set; } = "film";
    }

    // Listeye içerik ekleme
    public class ListeIcerikEkleDto
    {
        [Required]
        public long IcerikId { get; set; }

        public int Sira { get; set; } = 0;

        [MaxLength(500)]
        public string? NotMetni { get; set; }
    }

    // Listedeki içerik güncelleme (sıra/not)
    public class ListeIcerikGuncelleDto
    {
        public int Sira { get; set; }

        [MaxLength(500)]
        public string? NotMetni { get; set; }
    }

    // Liste paylaşım response
    public class ListePaylasildiDto
    {
        public long ListeId { get; set; }
        public string ListeAdi { get; set; } = null!;
        public string KullaniciAdi { get; set; } = null!;
        public string PaylasilmaUrl { get; set; } = null!;
        public bool HerkeseAcik { get; set; }
        public int IcerikSayisi { get; set; }
    }
}

