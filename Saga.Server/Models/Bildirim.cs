using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    [Table("bildirimler")]
    public class Bildirim
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("alici_id")]
        public Guid AliciId { get; set; }
        public Kullanici Alici { get; set; } = null!;

        [Column("gonderen_id")]
        public Guid? GonderenId { get; set; }
        public Kullanici? Gonderen { get; set; }

        [Column("tip")]
        public string Tip { get; set; } = null!;

        [Column("baslik")]
        public string Baslik { get; set; } = null!;

        [Column("mesaj")]
        public string Mesaj { get; set; } = null!;

        [Column("link_url")]
        public string? LinkUrl { get; set; }

        [Column("okundu")]
        public bool Okundu { get; set; } = false;

        [Column("silindi")]
        public bool Silindi { get; set; } = false;

        [Column("olusturulma_zamani")]
        public DateTime OlusturulmaZamani { get; set; } = DateTime.UtcNow;
    }
}