using Microsoft.EntityFrameworkCore;
using ReelPage.Server.Models;

namespace ReelPage.Server.Data
{
    public class ReelPageDbContext : DbContext
    {
        public ReelPageDbContext(DbContextOptions<ReelPageDbContext> options) : base(options)
        {
            // PostgreSQL tarih sorununu çözer (UTC kullanımı)
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
        }

        public DbSet<Kullanici> Kullanicilar { get; set; }
        public DbSet<Icerik> Icerikler { get; set; }
        public DbSet<Aktivite> Aktiviteler { get; set; }
        public DbSet<Puanlama> Puanlamalar { get; set; }
        public DbSet<Yorum> Yorumlar { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // JSONB Kolon Ayarları
            modelBuilder.Entity<Icerik>().Property(b => b.MetaVeri).HasColumnType("jsonb");
            modelBuilder.Entity<Aktivite>().Property(b => b.Veri).HasColumnType("jsonb");

            // İlişkiler (Aktivite -> Kullanıcı)
            modelBuilder.Entity<Aktivite>()
                .HasOne(a => a.Kullanici)
                .WithMany()
                .HasForeignKey(a => a.KullaniciId);

            modelBuilder.Entity<Yorum>()
                .HasOne(y => y.Kullanici)
                .WithMany()
                .HasForeignKey(y => y.KullaniciId);
        }
    }
}