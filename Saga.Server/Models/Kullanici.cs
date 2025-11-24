using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    [Table("kullanicilar")]
    public class Kullanici
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("kullanici_adi")]
        public string KullaniciAdi { get; set; } = null!;

        [Column("eposta")]
        public string Eposta { get; set; } = null!;

        [Column("goruntuleme_adi")]
        public string? GoruntulemeAdi { get; set; }

        [Column("biyografi")]
        public string? Biyografi { get; set; }

        [Column("avatar_url")]
        public string? AvatarUrl { get; set; }

        [Column("rol")] // Enum string olarak tutulacak
        public string Rol { get; set; } = "kullanici";

        [Column("olusturulma_zamani")]
        public DateTime OlusturulmaZamani { get; set; }
    }
}