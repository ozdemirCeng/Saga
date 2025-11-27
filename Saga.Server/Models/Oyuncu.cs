using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    [Table("oyuncular")]
    public class Oyuncu
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("harici_id")]
        public string? HariciId { get; set; } // TMDB person ID

        [Column("ad")]
        public string Ad { get; set; } = null!;

        [Column("profil_url")]
        public string? ProfilUrl { get; set; }

        [Column("biyografi")]
        public string? Biyografi { get; set; }

        [Column("dogum_tarihi")]
        public DateOnly? DogumTarihi { get; set; }

        [Column("dogum_yeri")]
        public string? DogumYeri { get; set; }

        [Column("cinsiyet")]
        public int? Cinsiyet { get; set; } // 0: belirtilmemiş, 1: kadın, 2: erkek

        [Column("olusturulma_zamani")]
        public DateTime OlusturulmaZamani { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<IcerikOyuncu> IcerikOyunculari { get; set; } = new List<IcerikOyuncu>();
    }
}
