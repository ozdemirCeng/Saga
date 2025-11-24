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
        public string ApiKaynagi { get; set; } = null!; // tmdb, google_books

        [Column("tur")]
        public string Tur { get; set; } = null!; // film, kitap

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

        [Column("populerlik_skoru")]
        public decimal PopulerlikSkoru { get; set; }

        // PostgreSQL JSONB kolonu
        [Column("meta_veri", TypeName = "jsonb")]
        public string MetaVeri { get; set; } = "{}";
    }
}