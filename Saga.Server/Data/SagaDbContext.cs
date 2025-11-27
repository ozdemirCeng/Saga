using Microsoft.EntityFrameworkCore;
using Saga.Server.Models;
using Npgsql; // Bu kütüphane şart!

namespace Saga.Server.Data
{
    public class SagaDbContext : DbContext
    {
        public SagaDbContext(DbContextOptions<SagaDbContext> options) : base(options)
        {
            // PostgreSQL tarih formatı sorunu için
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
        }

        // Tüm Tabloların Tanımı
        public DbSet<Kullanici> Kullanicilar { get; set; }
        public DbSet<Icerik> Icerikler { get; set; }
        public DbSet<Aktivite> Aktiviteler { get; set; }
        public DbSet<Puanlama> Puanlamalar { get; set; }
        public DbSet<Yorum> Yorumlar { get; set; }
        public DbSet<Takip> Takipler { get; set; }
        public DbSet<Liste> Listeler { get; set; }
        public DbSet<ListeIcerigi> ListeIcerikleri { get; set; }
        public DbSet<YorumBegeni> YorumBegenileri { get; set; }
        public DbSet<KutuphaneDurumu> KutuphaneDurumlari { get; set; }
        public DbSet<Bildirim> Bildirimler { get; set; }
        
        // Yeni tablolar
        public DbSet<AktiviteBegeni> AktiviteBegenileri { get; set; }
        public DbSet<AktiviteYorum> AktiviteYorumlari { get; set; }
        public DbSet<AktiviteYorumBegeni> AktiviteYorumBegenileri { get; set; }
        public DbSet<KullaniciAyarlari> KullaniciAyarlari { get; set; }
        public DbSet<Engellenen> Engellenenler { get; set; }
        public DbSet<IcerikFavori> IcerikFavorileri { get; set; }
        
        // Oyuncu tabloları
        public DbSet<Oyuncu> Oyuncular { get; set; }
        public DbSet<IcerikOyuncu> IcerikOyunculari { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 1. COMPOSITE KEYS (Çoklu Anahtarlar)
            // Bu tabloların tek bir ID'si yok, iki kolon birleşip anahtar oluyor.
            modelBuilder.Entity<Takip>()
                .HasKey(t => new { t.TakipEdenId, t.TakipEdilenId });

            modelBuilder.Entity<ListeIcerigi>()
                .HasKey(li => new { li.ListeId, li.IcerikId });

            modelBuilder.Entity<YorumBegeni>()
                .HasKey(yb => new { yb.KullaniciId, yb.YorumId });
            
            // Yeni composite key'ler
            modelBuilder.Entity<AktiviteBegeni>()
                .HasKey(ab => new { ab.KullaniciId, ab.AktiviteId });
            
            modelBuilder.Entity<AktiviteYorumBegeni>()
                .HasKey(ayb => new { ayb.KullaniciId, ayb.YorumId });
            
            modelBuilder.Entity<Engellenen>()
                .HasKey(e => new { e.EngelleyenId, e.EngellenenId });
            
            modelBuilder.Entity<IcerikFavori>()
                .HasKey(f => new { f.KullaniciId, f.IcerikId });

            // 2. JSONB AYARLARI
            // Bu kolonlar veritabanında JSON olarak saklanıyor
            modelBuilder.Entity<Icerik>()
                .Property(b => b.MetaVeri)
                .HasColumnType("jsonb");

            modelBuilder.Entity<Aktivite>()
                .Property(b => b.Veri)
                .HasColumnType("jsonb");
            
            modelBuilder.Entity<Bildirim>()
                .Property(b => b.MetaVeri)
                .HasColumnType("jsonb");

            // 3. ENUM AYARLARI (Hata almamak için string mapliyoruz)
            // SQL'de ENUM olsa bile C# tarafında string olarak çalışacağız.
            // Npgsql'in kafası karışmasın diye açıkça tip belirtiyoruz.

            modelBuilder.Entity<Icerik>(entity => {
                entity.Property(e => e.ApiKaynagi).HasColumnType("api_kaynak");
                entity.Property(e => e.Tur).HasColumnType("icerik_turu");
            });

            modelBuilder.Entity<Kullanici>(entity => {
                entity.Property(e => e.Rol).HasColumnType("kullanici_rol");
            });

            modelBuilder.Entity<Aktivite>(entity => {
                entity.Property(e => e.AktiviteTuru).HasColumnType("aktivite_turu");
            });

            modelBuilder.Entity<Liste>(entity => {
                entity.Property(e => e.Tur).HasColumnType("liste_turu");
            });

            modelBuilder.Entity<KutuphaneDurumu>(entity => {
                entity.Property(e => e.Durum).HasColumnType("kutuphane_durum");
            });

            // 4. İLİŞKİLER (Relationships)
            
            // Takip ilişkisi (self-referencing many-to-many)
            // TakipEden -> Takipler (kimin takip listesi)
            // TakipEdilen -> TakipEdenler (kimin takipçileri)
            modelBuilder.Entity<Kullanici>()
                .HasMany(k => k.Takipler)
                .WithOne(t => t.TakipEden)
                .HasForeignKey(t => t.TakipEdenId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Kullanici>()
                .HasMany(k => k.TakipEdenler)
                .WithOne(t => t.TakipEdilen)
                .HasForeignKey(t => t.TakipEdilenId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Aktivite>()
                .HasOne(a => a.Kullanici)
                .WithMany()
                .HasForeignKey(a => a.KullaniciId);

            modelBuilder.Entity<Yorum>()
                .HasOne(y => y.Kullanici)
                .WithMany(k => k.Yorumlari)
                .HasForeignKey(y => y.KullaniciId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Kullanıcı Ayarları ilişkisi (1-1)
            modelBuilder.Entity<Kullanici>()
                .HasOne(k => k.Ayarlar)
                .WithOne(a => a.Kullanici)
                .HasForeignKey<KullaniciAyarlari>(a => a.KullaniciId);
            
            // Aktivite Beğeni ilişkileri
            modelBuilder.Entity<AktiviteBegeni>()
                .HasOne(ab => ab.Aktivite)
                .WithMany(a => a.Begeniler)
                .HasForeignKey(ab => ab.AktiviteId);
            
            modelBuilder.Entity<AktiviteBegeni>()
                .HasOne(ab => ab.Kullanici)
                .WithMany()
                .HasForeignKey(ab => ab.KullaniciId);
            
            // Aktivite Yorum ilişkileri
            modelBuilder.Entity<AktiviteYorum>()
                .HasOne(ay => ay.Aktivite)
                .WithMany(a => a.AktiviteYorumlari)
                .HasForeignKey(ay => ay.AktiviteId);
            
            modelBuilder.Entity<AktiviteYorum>()
                .HasOne(ay => ay.Kullanici)
                .WithMany()
                .HasForeignKey(ay => ay.KullaniciId);
            
            // Aktivite Yorum yanıtları (self-referencing)
            modelBuilder.Entity<AktiviteYorum>()
                .HasOne(ay => ay.UstYorum)
                .WithMany(ay => ay.Yanitlar)
                .HasForeignKey(ay => ay.UstYorumId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Aktivite Yorum Beğeni ilişkileri
            modelBuilder.Entity<AktiviteYorumBegeni>()
                .HasOne(ayb => ayb.Yorum)
                .WithMany(ay => ay.Begeniler)
                .HasForeignKey(ayb => ayb.YorumId);
            
            modelBuilder.Entity<AktiviteYorumBegeni>()
                .HasOne(ayb => ayb.Kullanici)
                .WithMany()
                .HasForeignKey(ayb => ayb.KullaniciId);
            
            // İçerik Oyuncu ilişkileri
            modelBuilder.Entity<IcerikOyuncu>()
                .HasOne(io => io.Icerik)
                .WithMany(i => i.IcerikOyunculari)
                .HasForeignKey(io => io.IcerikId)
                .OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<IcerikOyuncu>()
                .HasOne(io => io.Oyuncu)
                .WithMany(o => o.IcerikOyunculari)
                .HasForeignKey(io => io.OyuncuId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Oyuncu için unique constraint (harici_id)
            modelBuilder.Entity<Oyuncu>()
                .HasIndex(o => o.HariciId)
                .IsUnique();
        }
    }
}