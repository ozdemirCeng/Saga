using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    /// <summary>
    /// Şifre sıfırlama token'larını saklar
    /// </summary>
    [Table("sifre_sifirlama_tokenlari")]
    public class SifreSifirlamaToken
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("kullanici_id")]
        public Guid KullaniciId { get; set; }

        [Required]
        [Column("token")]
        [StringLength(128)]
        public string Token { get; set; } = null!;

        [Required]
        [Column("eposta")]
        [StringLength(255)]
        public string Eposta { get; set; } = null!;

        [Column("olusturulma_zamani")]
        public DateTime OlusturulmaZamani { get; set; } = DateTime.UtcNow;

        [Column("gecerlilik_suresi")]
        public DateTime GecerlilikSuresi { get; set; }

        [Column("kullanildi")]
        public bool Kullanildi { get; set; } = false;

        [Column("kullanilma_zamani")]
        public DateTime? KullanilmaZamani { get; set; }
    }
}
