-- ============================================
-- SAGA PLATFORM - EKSİK TRİGGER'LAR
-- ============================================
-- Bu dosya schema_full.sql'e EKLENMEK üzere hazırlanmıştır
-- Eksik olan aktivite trigger'ları ve istatistik trigger'ları içerir

BEGIN;

-- ============================================
-- 1. TAKİP AKTİVİTESİ TRİGGER
-- ============================================
CREATE OR REPLACE FUNCTION aktivite_ekle_takip() RETURNS TRIGGER AS $$ 
BEGIN
    INSERT INTO aktiviteler (kullanici_id, aktivite_turu, veri)
    SELECT 
        NEW.takip_eden_id, 
        'takip', 
        jsonb_build_object(
            'takip_edilen_id', NEW.takip_edilen_id,
            'takip_edilen_adi', k.kullanici_adi, 
            'takip_edilen_avatar', k.avatar_url,
            'user', eden.kullanici_adi,
            'avatar', eden.avatar_url
        )
    FROM kullanicilar k, kullanicilar eden 
    WHERE k.id = NEW.takip_edilen_id 
      AND eden.id = NEW.takip_eden_id;
    
    RETURN NEW;
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_akt_takip ON takipler;
CREATE TRIGGER trg_akt_takip 
    AFTER INSERT ON takipler 
    FOR EACH ROW 
    EXECUTE FUNCTION aktivite_ekle_takip();

-- ============================================
-- 2. LİSTEYE EKLEME AKTİVİTESİ TRİGGER
-- ============================================
CREATE OR REPLACE FUNCTION aktivite_ekle_liste_icerik() RETURNS TRIGGER AS $$ 
BEGIN
    INSERT INTO aktiviteler (kullanici_id, aktivite_turu, icerik_id, liste_id, veri)
    SELECT 
        l.kullanici_id, 
        'listeye_ekleme', 
        NEW.icerik_id,
        NEW.liste_id,
        jsonb_build_object(
            'liste_adi', l.ad,
            'liste_id', l.id,
            'icerik_baslik', i.baslik,
            'icerik_poster', i.poster_url,
            'icerik_tur', i.tur,
            'user', k.kullanici_adi,
            'avatar', k.avatar_url
        )
    FROM listeler l
    INNER JOIN icerikler i ON i.id = NEW.icerik_id
    INNER JOIN kullanicilar k ON k.id = l.kullanici_id
    WHERE l.id = NEW.liste_id
      AND l.tur = 'ozel';  -- Sadece özel listeler için aktivite oluştur
    
    RETURN NEW;
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_akt_liste ON liste_icerikleri;
CREATE TRIGGER trg_akt_liste 
    AFTER INSERT ON liste_icerikleri 
    FOR EACH ROW 
    EXECUTE FUNCTION aktivite_ekle_liste_icerik();

-- ============================================
-- 3. KÜTÜPHANE DURUM AKTİVİTESİ TRİGGER
-- ============================================
CREATE OR REPLACE FUNCTION aktivite_ekle_kutuphane_durum() RETURNS TRIGGER AS $$ 
BEGIN
    -- Sadece INSERT veya durum değişikliği varsa aktivite ekle
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.durum != NEW.durum)) THEN
        INSERT INTO aktiviteler (kullanici_id, aktivite_turu, icerik_id, veri)
        SELECT 
            NEW.kullanici_id, 
            'durum_guncelleme', 
            NEW.icerik_id,
            jsonb_build_object(
                'durum', NEW.durum,
                'ilerleme', NEW.ilerleme,
                'icerik_baslik', i.baslik,
                'icerik_poster', i.poster_url,
                'icerik_tur', i.tur,
                'user', k.kullanici_adi,
                'avatar', k.avatar_url
            )
        FROM icerikler i
        INNER JOIN kullanicilar k ON k.id = NEW.kullanici_id
        WHERE i.id = NEW.icerik_id;
    END IF;
    
    RETURN NEW;
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_akt_kutuphane ON kutuphane_durumlari;
CREATE TRIGGER trg_akt_kutuphane 
    AFTER INSERT OR UPDATE ON kutuphane_durumlari 
    FOR EACH ROW 
    EXECUTE FUNCTION aktivite_ekle_kutuphane_durum();

-- ============================================
-- 4. YORUM BEĞENİ SAYISI GÜNCELLEME TRİGGER
-- ============================================
CREATE OR REPLACE FUNCTION yorum_begeni_sayisi_guncelle() RETURNS TRIGGER AS $$ 
DECLARE
    v_yorum_id BIGINT;
    v_yeni_sayi INTEGER;
BEGIN
    -- INSERT veya DELETE'den yorum ID'sini al
    v_yorum_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.yorum_id ELSE NEW.yorum_id END;
    
    -- Yeni beğeni sayısını hesapla
    SELECT COUNT(*) INTO v_yeni_sayi 
    FROM yorum_begenileri 
    WHERE yorum_id = v_yorum_id;
    
    -- Yorumun beğeni sayısını güncelle
    UPDATE yorumlar 
    SET begeni_sayisi = v_yeni_sayi 
    WHERE id = v_yorum_id;
    
    RETURN NULL;
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_yorum_begeni_stats ON yorum_begenileri;
CREATE TRIGGER trg_yorum_begeni_stats 
    AFTER INSERT OR DELETE ON yorum_begenileri 
    FOR EACH ROW 
    EXECUTE FUNCTION yorum_begeni_sayisi_guncelle();

-- ============================================
-- 5. LİSTE İÇERİK SAYISI GÜNCELLEME TRİGGER
-- ============================================
CREATE OR REPLACE FUNCTION liste_icerik_sayisi_guncelle() RETURNS TRIGGER AS $$ 
DECLARE
    v_liste_id BIGINT;
    v_yeni_sayi INTEGER;
BEGIN
    -- INSERT veya DELETE'den liste ID'sini al
    v_liste_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.liste_id ELSE NEW.liste_id END;
    
    -- Yeni içerik sayısını hesapla
    SELECT COUNT(*) INTO v_yeni_sayi 
    FROM liste_icerikleri 
    WHERE liste_id = v_liste_id;
    
    -- Listenin içerik sayısını güncelle
    UPDATE listeler 
    SET icerik_sayisi = v_yeni_sayi,
        guncelleme_zamani = NOW()
    WHERE id = v_liste_id;
    
    RETURN NULL;
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_liste_icerik_stats ON liste_icerikleri;
CREATE TRIGGER trg_liste_icerik_stats 
    AFTER INSERT OR DELETE ON liste_icerikleri 
    FOR EACH ROW 
    EXECUTE FUNCTION liste_icerik_sayisi_guncelle();

COMMIT;

-- ============================================
-- KONTROL SORGUSU
-- ============================================
-- Trigger'ların düzgün çalıştığını test etmek için:
-- 
-- -- Takip testi:
-- INSERT INTO takipler (takip_eden_id, takip_edilen_id) VALUES ('user1-uuid', 'user2-uuid');
-- SELECT * FROM aktiviteler WHERE aktivite_turu = 'takip' ORDER BY olusturulma_zamani DESC LIMIT 1;
--
-- -- Liste ekleme testi:
-- INSERT INTO liste_icerikleri (liste_id, icerik_id, sira) VALUES (1, 100, 1);
-- SELECT * FROM aktiviteler WHERE aktivite_turu = 'listeye_ekleme' ORDER BY olusturulma_zamani DESC LIMIT 1;
--
-- -- Kütüphane durum testi:
-- INSERT INTO kutuphane_durumlari (kullanici_id, icerik_id, durum) VALUES ('user-uuid', 200, 'izlendi');
-- SELECT * FROM aktiviteler WHERE aktivite_turu = 'durum_guncelleme' ORDER BY olusturulma_zamani DESC LIMIT 1;
--
-- -- Yorum beğeni testi:
-- INSERT INTO yorum_begenileri (kullanici_id, yorum_id) VALUES ('user-uuid', 1);
-- SELECT begeni_sayisi FROM yorumlar WHERE id = 1;
--
-- -- Liste içerik sayısı testi:
-- SELECT icerik_sayisi FROM listeler WHERE id = 1;
