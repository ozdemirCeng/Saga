using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    [Table("aktiviteler")]
    public class Aktivite
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("kullanici_id")]
        public Guid KullaniciId { get; set; }
        public Kullanici Kullanici { get; set; } = null!;

        [Column("aktivite_turu")]
        public string AktiviteTuru { get; set; } = null!; // puanlama, yorum

        [Column("icerik_id")]
        public long? IcerikId { get; set; }

        // JSONB verisi (Film adı, poster vs. burada saklı)
        [Column("veri", TypeName = "jsonb")]
        public string Veri { get; set; } = "{}";

        [Column("olusturulma_zamani")]
        public DateTime OlusturulmaZamani { get; set; }
    }
}