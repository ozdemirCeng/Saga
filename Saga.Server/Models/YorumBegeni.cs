using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    [Table("yorum_begenileri")]
    public class YorumBegeni
    {
        [Key]
        [Column("kullanici_id", Order = 0)]
        public Guid KullaniciId { get; set; }
        public Kullanici Kullanici { get; set; } = null!;

        [Key]
        [Column("yorum_id", Order = 1)]
        public long YorumId { get; set; }
        public Yorum Yorum { get; set; } = null!;

        [Column("olusturulma_zamani")]
        public DateTime OlusturulmaZamani { get; set; } = DateTime.UtcNow;
    }
}