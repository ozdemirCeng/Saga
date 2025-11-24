using System.ComponentModel.DataAnnotations.Schema;
namespace Saga.Server.Models
{
    [Table("puanlamalar")]
    public class Puanlama
    {
        [Column("id")] public long Id { get; set; }
        [Column("kullanici_id")] public Guid KullaniciId { get; set; }
        [Column("icerik_id")] public long IcerikId { get; set; }
        [Column("puan")] public decimal Puan { get; set; }
    }
}