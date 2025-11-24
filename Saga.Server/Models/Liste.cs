using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    [Table("listeler")]
    public class Liste
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("kullanici_id")]
        public Guid KullaniciId { get; set; }
        public Kullanici Kullanici { get; set; } = null!;

        [Column("ad")]
        public string Ad { get; set; } = null!;

        [Column("tur")]
        public ListeTuru Tur { get; set; } = ListeTuru.ozel;

        [Column("aciklama")]
        public string? Aciklama { get; set; }

        [Column("herkese_acik")]
        public bool HerkeseAcik { get; set; } = true;

        [Column("icerik_sayisi")]
        public int IcerikSayisi { get; set; } = 0;

        [Column("silindi")]
        public bool Silindi { get; set; } = false;

        [Column("olusturulma_zamani")]
        public DateTime OlusturulmaZamani { get; set; } = DateTime.UtcNow;

        [Column("guncelleme_zamani")]
        public DateTime GuncellemeZamani { get; set; } = DateTime.UtcNow;
    }
}