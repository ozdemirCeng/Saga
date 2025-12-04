namespace Saga.Server.Models
{
    // Veritabanındaki isimlerle birebir aynı (küçük harf) olmalı
    public enum ApiKaynak
    {
        tmdb,
        google_books,
        diger
    }

    public enum IcerikTuru
    {
        film,
        kitap,
        dizi
    }

    public enum KullaniciRol
    {
        yonetici,
        moderator,
        kullanici
    }

    public enum AktiviteTuru
    {
        puanlama,
        yorum,
        listeye_ekleme,
        takip,
        durum_guncelleme
    }

    public enum ListeTuru
    {
        sistem,
        ozel
    }

    public enum KutuphaneDurum
    {
        izlendi,
        izlenecek,
        okundu,
        okunacak,
        devam_ediyor
    }
}