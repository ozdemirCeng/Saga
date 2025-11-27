using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    [Table("icerik_oyunculari")]
    public class IcerikOyuncu
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("icerik_id")]
        public long IcerikId { get; set; }

        [Column("oyuncu_id")]
        public long OyuncuId { get; set; }

        [Column("karakter")]
        public string? Karakter { get; set; } // Oynadığı karakter adı

        [Column("sira")]
        public int Sira { get; set; } // Kredilerde sıralama (cast order)

        [Column("rol_tipi")]
        public string RolTipi { get; set; } = "oyuncu"; // oyuncu, yonetmen, yapimci, senarist

        // Navigation
        [ForeignKey("IcerikId")]
        public Icerik Icerik { get; set; } = null!;

        [ForeignKey("OyuncuId")]
        public Oyuncu Oyuncu { get; set; } = null!;
    }
}
