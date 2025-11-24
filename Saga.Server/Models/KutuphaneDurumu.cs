using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    [Table("kutuphane_durumlari")]
    public class KutuphaneDurumu
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("kullanici_id")]
        public Guid KullaniciId { get; set; }
        public Kullanici Kullanici { get; set; } = null!;

        [Column("icerik_id")]
        public long IcerikId { get; set; }
        public Icerik Icerik { get; set; } = null!;

        [Column("durum")]
        public KutuphaneDurum Durum { get; set; }

        [Column("ilerleme")]
        public decimal Ilerleme { get; set; } = 0;

        [Column("baslangic_tarihi")]
        public DateOnly? BaslangicTarihi { get; set; }

        [Column("bitis_tarihi")]
        public DateOnly? BitisTarihi { get; set; }

        [Column("silindi")]
        public bool Silindi { get; set; } = false;

        [Column("olusturulma_zamani")]
        public DateTime OlusturulmaZamani { get; set; } = DateTime.UtcNow;

        [Column("guncelleme_zamani")]
        public DateTime GuncellemeZamani { get; set; } = DateTime.UtcNow;
    }
}