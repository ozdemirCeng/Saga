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
        public AktiviteTuru AktiviteTuru { get; set; }

        [Column("icerik_id")]
        public long? IcerikId { get; set; }
        public Icerik? Icerik { get; set; }

        [Column("puanlama_id")]
        public long? PuanlamaId { get; set; }
        public Puanlama? Puanlama { get; set; }

        [Column("yorum_id")]
        public long? YorumId { get; set; }
        public Yorum? Yorum { get; set; }

        [Column("liste_id")]
        public long? ListeId { get; set; }
        public Liste? Liste { get; set; }

        [Column("veri", TypeName = "jsonb")]
        public string Veri { get; set; } = "{}";

        [Column("silindi")]
        public bool Silindi { get; set; } = false;

        [Column("olusturulma_zamani")]
        public DateTime OlusturulmaZamani { get; set; } = DateTime.UtcNow;
    }
}