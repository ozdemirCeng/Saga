using System.ComponentModel.DataAnnotations.Schema;
namespace Saga.Server.Models
{
    [Table("yorumlar")]
    public class Yorum
    {
        [Column("id")] public long Id { get; set; }
        [Column("kullanici_id")] public Guid KullaniciId { get; set; }
        public Kullanici Kullanici { get; set; } = null!;
        [Column("icerik_id")] public long IcerikId { get; set; }
        [Column("icerik")] public string IcerikMetni { get; set; } = null!;
        [Column("olusturulma_zamani")] public DateTime OlusturulmaZamani { get; set; }
    }
}