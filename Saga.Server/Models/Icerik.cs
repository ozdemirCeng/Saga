using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Saga.Server.Models
{
    [Table("icerikler")]
    public class Icerik
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("harici_id")]
        public string HariciId { get; set; } = null!;

        [Column("api_kaynagi")]
        public ApiKaynak ApiKaynagi { get; set; }

        [Column("tur")]
        public IcerikTuru Tur { get; set; }

        [Column("baslik")]
        public string Baslik { get; set; } = null!;

        [Column("aciklama")]
        public string? Aciklama { get; set; }

        [Column("poster_url")]
        public string? PosterUrl { get; set; }

        [Column("yayin_tarihi")]
        public DateOnly? YayinTarihi { get; set; }

        [Column("ortalama_puan")]
        public decimal OrtalamaPuan { get; set; }

        [Column("puanlama_sayisi")]
        public int PuanlamaSayisi { get; set; }

        [Column("yorum_sayisi")]
        public int YorumSayisi { get; set; }

        [Column("listeye_eklenme_sayisi")]
        public int ListeyeEklenmeSayisi { get; set; }

        [Column("goruntuleme_sayisi")]
        public int GoruntulemeSayisi { get; set; }

        [Column("populerlik_skoru")]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public decimal PopulerlikSkoru { get; set; }

        // Generated tsvector column - EF tarafından ignore edilir
        [NotMapped]
        public string? AramaVektoru { get; set; }

        [Column("silindi")]
        public bool Silindi { get; set; }

        [Column("olusturulma_zamani")]
        public DateTime OlusturulmaZamani { get; set; } = DateTime.UtcNow;

        [Column("guncelleme_zamani")]
        public DateTime GuncellemeZamani { get; set; } = DateTime.UtcNow;

        [Column("meta_veri", TypeName = "jsonb")]
        public string MetaVeri { get; set; } = "{}";
    }
}