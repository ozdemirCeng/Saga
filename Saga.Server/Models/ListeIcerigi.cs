using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    [Table("liste_icerikleri")]
    public class ListeIcerigi
    {
        [Key]
        [Column("liste_id", Order = 0)]
        public long ListeId { get; set; }
        public Liste Liste { get; set; } = null!;

        [Key]
        [Column("icerik_id", Order = 1)]
        public long IcerikId { get; set; }
        public Icerik Icerik { get; set; } = null!;

        [Column("sira")]
        public int Sira { get; set; } = 0;

        [Column("not_metni")]
        public string? NotMetni { get; set; }

        [Column("eklenme_zamani")]
        public DateTime EklenmeZamani { get; set; } = DateTime.UtcNow;
    }
}