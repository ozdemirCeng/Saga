using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    [Table("yorumlar")]
    public class Yorum
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("kullanici_id")]
        public Guid KullaniciId { get; set; }
        public Kullanici Kullanici { get; set; } = null!;

        [Column("icerik_id")]
        public long IcerikId { get; set; }
        public Icerik Icerik { get; set; } = null!;

        [Column("baslik")]
        public string? Baslik { get; set; }

        [Column("icerik")]
        public string IcerikMetni { get; set; } = null!;

        [Column("puan")]
        public decimal? Puan { get; set; }

        [Column("begeni_sayisi")]
        public int BegeniSayisi { get; set; } = 0;

        [Column("spoiler_iceriyor")]
        public bool SpoilerIceriyor { get; set; } = false;

        [Column("silindi")]
        public bool Silindi { get; set; } = false;

        [Column("olusturulma_zamani")]
        public DateTime OlusturulmaZamani { get; set; } = DateTime.UtcNow;

        [Column("guncelleme_zamani")]
        public DateTime? GuncellemeZamani { get; set; }

        // Navigation properties
        public ICollection<YorumBegeni> Begenenler { get; set; } = new List<YorumBegeni>();
    }
}