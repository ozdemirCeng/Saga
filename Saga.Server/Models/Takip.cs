using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    [Table("takipler")]
    public class Takip
    {
        [Key]
        [Column("takip_eden_id", Order = 0)]
        public Guid TakipEdenId { get; set; }
        public Kullanici TakipEden { get; set; } = null!;

        [Key]
        [Column("takip_edilen_id", Order = 1)]
        public Guid TakipEdilenId { get; set; }
        public Kullanici TakipEdilen { get; set; } = null!;

        [Column("olusturulma_zamani")]
        public DateTime OlusturulmaZamani { get; set; } = DateTime.UtcNow;
    }
}