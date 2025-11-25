

BEGIN;

-- 1) EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- IMMUTABLE UNACCENT WRAPPER (Supabase için gerekli)
CREATE OR REPLACE FUNCTION unaccent_immutable(p_text text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    RETURN unaccent(p_text);
EXCEPTION WHEN OTHERS THEN
    RETURN p_text; -- Fallback
END;$$;

-- 2) TYPES & DOMAINS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kullanici_rol') THEN
        CREATE TYPE kullanici_rol AS ENUM ('yonetici', 'moderator', 'kullanici');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'icerik_turu') THEN
        CREATE TYPE icerik_turu AS ENUM ('film', 'kitap');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'api_kaynak') THEN
        CREATE TYPE api_kaynak AS ENUM ('tmdb', 'google_books', 'diger');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kutuphane_durum') THEN
        CREATE TYPE kutuphane_durum AS ENUM ('izlendi', 'izlenecek', 'okundu', 'okunacak', 'devam_ediyor');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'liste_turu') THEN
        CREATE TYPE liste_turu AS ENUM ('sistem', 'ozel');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aktivite_turu') THEN
        CREATE TYPE aktivite_turu AS ENUM ('puanlama', 'yorum', 'listeye_ekleme', 'takip', 'durum_guncelleme');
    END IF;
END $$;

-- 3) CORE TABLES (Tenants kaldırıldı, Partitioning kaldırıldı)

-- KULLANICILAR
CREATE TABLE IF NOT EXISTS kullanicilar (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    kullanici_adi VARCHAR(50) NOT NULL UNIQUE,
    eposta VARCHAR(255) NOT NULL UNIQUE,
    goruntuleme_adi VARCHAR(100),
    biyografi TEXT,
    avatar_url TEXT,
    rol kullanici_rol NOT NULL DEFAULT 'kullanici',
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    silindi BOOLEAN NOT NULL DEFAULT FALSE,
    son_giris_zamani TIMESTAMPTZ,
    giris_sayisi INTEGER NOT NULL DEFAULT 0,
    olusturulma_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    guncelleme_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- İÇERİKLER
CREATE TABLE IF NOT EXISTS icerikler (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    harici_id VARCHAR(128) NOT NULL,
    api_kaynagi api_kaynak NOT NULL,
    tur icerik_turu NOT NULL,
    baslik VARCHAR(512) NOT NULL,
    aciklama TEXT,
    poster_url TEXT,
    yayin_tarihi DATE,
    meta_veri JSONB NOT NULL DEFAULT '{}'::jsonb,
    ortalama_puan NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    puanlama_sayisi INTEGER NOT NULL DEFAULT 0,
    yorum_sayisi INTEGER NOT NULL DEFAULT 0,
    listeye_eklenme_sayisi INTEGER NOT NULL DEFAULT 0,
    goruntuleme_sayisi INTEGER NOT NULL DEFAULT 0,
    populerlik_skoru NUMERIC(10,2) GENERATED ALWAYS AS (
        (COALESCE(puanlama_sayisi,0) * 2.0) +
        (COALESCE(yorum_sayisi,0) * 5.0) +
        (COALESCE(listeye_eklenme_sayisi,0) * 3.0) +
        (COALESCE(goruntuleme_sayisi,0) * 0.1)
    ) STORED,
    arama_vektoru tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('turkish', COALESCE(baslik,'')), 'A') ||
        setweight(to_tsvector('turkish', COALESCE(aciklama,'')), 'B')
    ) STORED,
    silindi BOOLEAN NOT NULL DEFAULT FALSE,
    olusturulma_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    guncelleme_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (harici_id, api_kaynagi)
);

-- TAKİPLER
CREATE TABLE IF NOT EXISTS takipler (
    takip_eden_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    takip_edilen_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    olusturulma_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (takip_eden_id, takip_edilen_id),
    CONSTRAINT chk_kendi_kendini_takip_etme CHECK (takip_eden_id != takip_edilen_id)
);

-- LİSTELER
CREATE TABLE IF NOT EXISTS listeler (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kullanici_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    ad VARCHAR(200) NOT NULL,
    tur liste_turu NOT NULL,
    aciklama TEXT,
    herkese_acik BOOLEAN NOT NULL DEFAULT TRUE,
    icerik_sayisi INTEGER NOT NULL DEFAULT 0,
    silindi BOOLEAN NOT NULL DEFAULT FALSE,
    olusturulma_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    guncelleme_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LİSTE İÇERİKLERİ
CREATE TABLE IF NOT EXISTS liste_icerikleri (
    liste_id BIGINT NOT NULL REFERENCES listeler(id) ON DELETE CASCADE,
    icerik_id BIGINT NOT NULL REFERENCES icerikler(id) ON DELETE CASCADE,
    sira INTEGER NOT NULL DEFAULT 0,
    not_metni TEXT,
    eklenme_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (liste_id, icerik_id)
);

-- PUANLAMALAR
CREATE TABLE IF NOT EXISTS puanlamalar (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kullanici_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    icerik_id BIGINT NOT NULL REFERENCES icerikler(id) ON DELETE CASCADE,
    puan NUMERIC(3,1) NOT NULL CHECK (puan BETWEEN 1.0 AND 10.0),
    silindi BOOLEAN NOT NULL DEFAULT FALSE,
    olusturulma_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    guncelleme_zamani TIMESTAMPTZ,
    UNIQUE (kullanici_id, icerik_id)
);

-- YORUMLAR
CREATE TABLE IF NOT EXISTS yorumlar (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kullanici_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    icerik_id BIGINT NOT NULL REFERENCES icerikler(id) ON DELETE CASCADE,
    baslik VARCHAR(255),
    icerik TEXT NOT NULL,
    puan NUMERIC(3,1),
    begeni_sayisi INTEGER NOT NULL DEFAULT 0,
    spoiler_iceriyor BOOLEAN NOT NULL DEFAULT FALSE,
    silindi BOOLEAN NOT NULL DEFAULT FALSE,
    olusturulma_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    guncelleme_zamani TIMESTAMPTZ
);

-- YORUM BEĞENİLERİ
CREATE TABLE IF NOT EXISTS yorum_begenileri (
    kullanici_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    yorum_id BIGINT NOT NULL REFERENCES yorumlar(id) ON DELETE CASCADE,
    olusturulma_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (kullanici_id, yorum_id)
);

-- KÜTÜPHANE DURUMLARI
CREATE TABLE IF NOT EXISTS kutuphane_durumlari (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kullanici_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    icerik_id BIGINT NOT NULL REFERENCES icerikler(id) ON DELETE CASCADE,
    durum kutuphane_durum NOT NULL,
    ilerleme NUMERIC(5,2) DEFAULT 0.00,
    baslangic_tarihi DATE,
    bitis_tarihi DATE,
    silindi BOOLEAN NOT NULL DEFAULT FALSE,
    olusturulma_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    guncelleme_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (kullanici_id, icerik_id)
);

-- AKTİVİTELER (DÜZ TABLO YAPILDI - Partitioning Kaldırıldı)
CREATE TABLE IF NOT EXISTS aktiviteler (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kullanici_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    aktivite_turu aktivite_turu NOT NULL,
    icerik_id BIGINT REFERENCES icerikler(id) ON DELETE SET NULL,
    puanlama_id BIGINT REFERENCES puanlamalar(id) ON DELETE SET NULL,
    yorum_id BIGINT REFERENCES yorumlar(id) ON DELETE SET NULL,
    liste_id BIGINT REFERENCES listeler(id) ON DELETE SET NULL,
    veri JSONB NOT NULL DEFAULT '{}'::jsonb,
    silindi BOOLEAN NOT NULL DEFAULT FALSE,
    olusturulma_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BİLDİRİMLER
CREATE TABLE IF NOT EXISTS bildirimler (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    alici_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    gonderen_id UUID REFERENCES kullanicilar(id) ON DELETE SET NULL,
    tip VARCHAR(50) NOT NULL,
    baslik VARCHAR(255) NOT NULL,
    mesaj TEXT NOT NULL,
    link_url TEXT,
    okundu BOOLEAN NOT NULL DEFAULT FALSE,
    silindi BOOLEAN NOT NULL DEFAULT FALSE,
    olusturulma_zamani TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) INDEXES
CREATE INDEX IF NOT EXISTS idx_icerikler_harici_id ON icerikler (harici_id, api_kaynagi);
CREATE INDEX IF NOT EXISTS idx_icerikler_arama ON icerikler USING gin (arama_vektoru);
CREATE INDEX IF NOT EXISTS idx_icerikler_baslik_trgm ON icerikler USING gin (lower(unaccent_immutable(baslik)) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_icerikler_populerlik ON icerikler (populerlik_skoru DESC);
CREATE INDEX IF NOT EXISTS idx_aktiviteler_feed ON aktiviteler (kullanici_id, olusturulma_zamani DESC);
CREATE INDEX IF NOT EXISTS idx_aktiviteler_veri ON aktiviteler USING gin (veri);
CREATE INDEX IF NOT EXISTS idx_puanlamalar_kullanici_icerik ON puanlamalar (kullanici_id, icerik_id);

-- 5) TRIGGER FUNCS (Logic Here)

-- Güncelleme Zamanı Trigger
CREATE OR REPLACE FUNCTION guncelleme_zamani_ayarla() RETURNS TRIGGER AS $$
BEGIN NEW.guncelleme_zamani = NOW(); RETURN NEW; END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kullanicilar_upd BEFORE UPDATE ON kullanicilar FOR EACH ROW EXECUTE FUNCTION guncelleme_zamani_ayarla();
CREATE TRIGGER trg_icerikler_upd BEFORE UPDATE ON icerikler FOR EACH ROW EXECUTE FUNCTION guncelleme_zamani_ayarla();
CREATE TRIGGER trg_listeler_upd BEFORE UPDATE ON listeler FOR EACH ROW EXECUTE FUNCTION guncelleme_zamani_ayarla();

-- İstatistik Güncelleme (CORE LOGIC)
CREATE OR REPLACE FUNCTION icerik_istatistiklerini_guncelle(p_icerik_id BIGINT) RETURNS VOID AS $$
DECLARE v_puan_say INTEGER; v_ort_puan NUMERIC; v_yorum_say INTEGER; v_liste_say INTEGER;
BEGIN
    SELECT COUNT(*), COALESCE(AVG(puan),0) INTO v_puan_say, v_ort_puan FROM puanlamalar WHERE icerik_id = p_icerik_id AND silindi = FALSE;
    SELECT COUNT(*) INTO v_yorum_say FROM yorumlar WHERE icerik_id = p_icerik_id AND silindi = FALSE;
    SELECT COUNT(*) INTO v_liste_say FROM liste_icerikleri WHERE icerik_id = p_icerik_id;
    
    UPDATE icerikler SET 
        puanlama_sayisi = v_puan_say, 
        ortalama_puan = ROUND(v_ort_puan, 2), 
        yorum_sayisi = v_yorum_say, 
        listeye_eklenme_sayisi = v_liste_say,
        guncelleme_zamani = NOW()
    WHERE id = p_icerik_id;
END;$$ LANGUAGE plpgsql;

-- Trigger Bağlamaları
CREATE OR REPLACE FUNCTION trg_stats_update() RETURNS TRIGGER AS $$ 
BEGIN 
    PERFORM icerik_istatistiklerini_guncelle(CASE WHEN TG_OP='DELETE' THEN OLD.icerik_id ELSE NEW.icerik_id END); 
    RETURN NULL; 
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_puanlamalar_stats AFTER INSERT OR UPDATE OR DELETE ON puanlamalar FOR EACH ROW EXECUTE FUNCTION trg_stats_update();
CREATE TRIGGER trg_yorumlar_stats AFTER INSERT OR UPDATE OR DELETE ON yorumlar FOR EACH ROW EXECUTE FUNCTION trg_stats_update();
CREATE TRIGGER trg_liste_icerikleri_stats AFTER INSERT OR UPDATE OR DELETE ON liste_icerikleri FOR EACH ROW EXECUTE FUNCTION trg_stats_update();

-- Aktivite Oluşturma Triggerları (Feed için)
CREATE OR REPLACE FUNCTION aktivite_ekle_puanlama() RETURNS TRIGGER AS $$ BEGIN
    INSERT INTO aktiviteler (kullanici_id, aktivite_turu, icerik_id, puanlama_id, veri)
    SELECT NEW.kullanici_id, 'puanlama', NEW.icerik_id, NEW.id, 
           jsonb_build_object('puan', NEW.puan, 'baslik', i.baslik, 'poster', i.poster_url, 'tur', i.tur, 'user', k.kullanici_adi, 'avatar', k.avatar_url)
    FROM icerikler i, kullanicilar k WHERE i.id = NEW.icerik_id AND k.id = NEW.kullanici_id;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_akt_puan AFTER INSERT ON puanlamalar FOR EACH ROW EXECUTE FUNCTION aktivite_ekle_puanlama();

CREATE OR REPLACE FUNCTION aktivite_ekle_yorum() RETURNS TRIGGER AS $$ BEGIN
    INSERT INTO aktiviteler (kullanici_id, aktivite_turu, icerik_id, yorum_id, veri)
    SELECT NEW.kullanici_id, 'yorum', NEW.icerik_id, NEW.id, 
           jsonb_build_object('ozet', LEFT(NEW.icerik, 150), 'baslik', i.baslik, 'poster', i.poster_url, 'user', k.kullanici_adi, 'avatar', k.avatar_url)
    FROM icerikler i, kullanicilar k WHERE i.id = NEW.icerik_id AND k.id = NEW.kullanici_id;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_akt_yorum AFTER INSERT ON yorumlar FOR EACH ROW EXECUTE FUNCTION aktivite_ekle_yorum();

-- 6) MATERIALIZED VIEWS (Raporlama için)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_populer_icerikler AS
SELECT id, baslik, tur, poster_url, populerlik_skoru, ortalama_puan 
FROM icerikler WHERE puanlama_sayisi >= 1 ORDER BY populerlik_skoru DESC LIMIT 100;
CREATE UNIQUE INDEX idx_mv_pop_id ON mv_populer_icerikler(id);

-- 7) AUTH SYNC (Supabase Auth -> Public Users)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.kullanicilar (id, eposta, kullanici_adi, goruntuleme_adi, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8) ROW LEVEL SECURITY (RLS) - Basic Policies
ALTER TABLE kullanicilar ENABLE ROW LEVEL SECURITY;
ALTER TABLE icerikler ENABLE ROW LEVEL SECURITY;
ALTER TABLE puanlamalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE yorumlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE listeler ENABLE ROW LEVEL SECURITY;

-- Herkes her şeyi görebilir (Okuma)
CREATE POLICY "Public Read" ON kullanicilar FOR SELECT USING (true);
CREATE POLICY "Public Read" ON icerikler FOR SELECT USING (true);
CREATE POLICY "Public Read" ON puanlamalar FOR SELECT USING (true);
CREATE POLICY "Public Read" ON yorumlar FOR SELECT USING (true);
CREATE POLICY "Public Read" ON listeler FOR SELECT USING (herkese_acik = true OR kullanici_id = auth.uid());

-- Sadece sahibi değiştirebilir (Yazma)
CREATE POLICY "Owner Write" ON puanlamalar FOR ALL USING (auth.uid() = kullanici_id);
CREATE POLICY "Owner Write" ON yorumlar FOR ALL USING (auth.uid() = kullanici_id);
CREATE POLICY "Owner Write" ON listeler FOR ALL USING (auth.uid() = kullanici_id);
CREATE POLICY "Owner Write" ON kullanicilar FOR UPDATE USING (auth.uid() = id);

COMMIT;

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
veri tabanı bunlar eklendi