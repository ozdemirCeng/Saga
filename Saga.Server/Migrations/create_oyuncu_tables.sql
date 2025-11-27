-- =====================================================
-- SAGA - Oyuncu Tabloları Migration
-- Tarih: 2025-11-27
-- Açıklama: Oyuncu ve içerik-oyuncu ilişki tabloları
-- =====================================================

-- 1. OYUNCULAR TABLOSU
CREATE TABLE IF NOT EXISTS oyuncular (
    id BIGSERIAL PRIMARY KEY,
    harici_id VARCHAR(50) UNIQUE, -- TMDB person ID
    ad VARCHAR(255) NOT NULL,
    profil_url TEXT,
    biyografi TEXT,
    dogum_tarihi DATE,
    dogum_yeri VARCHAR(255),
    cinsiyet SMALLINT DEFAULT 0, -- 0: belirtilmemiş, 1: kadın, 2: erkek
    olusturulma_zamani TIMESTAMPTZ DEFAULT NOW()
);

-- 2. İÇERİK-OYUNCU İLİŞKİ TABLOSU
CREATE TABLE IF NOT EXISTS icerik_oyunculari (
    id BIGSERIAL PRIMARY KEY,
    icerik_id BIGINT NOT NULL REFERENCES icerikler(id) ON DELETE CASCADE,
    oyuncu_id BIGINT NOT NULL REFERENCES oyuncular(id) ON DELETE CASCADE,
    karakter VARCHAR(255), -- Oynadığı karakter adı
    sira INT DEFAULT 0, -- Kredilerde sıralama
    rol_tipi VARCHAR(50) DEFAULT 'oyuncu', -- oyuncu, yonetmen, yapimci, senarist
    UNIQUE(icerik_id, oyuncu_id, rol_tipi) -- Aynı içerikte aynı oyuncu aynı rolde tekrar edemez
);

-- 3. INDEX'LER
CREATE INDEX IF NOT EXISTS idx_oyuncular_ad ON oyuncular(ad);
CREATE INDEX IF NOT EXISTS idx_oyuncular_harici_id ON oyuncular(harici_id);
CREATE INDEX IF NOT EXISTS idx_icerik_oyunculari_icerik_id ON icerik_oyunculari(icerik_id);
CREATE INDEX IF NOT EXISTS idx_icerik_oyunculari_oyuncu_id ON icerik_oyunculari(oyuncu_id);
CREATE INDEX IF NOT EXISTS idx_icerik_oyunculari_sira ON icerik_oyunculari(icerik_id, sira);

-- 4. YÖNETMENLER İÇİN ÖZEL INDEX
CREATE INDEX IF NOT EXISTS idx_icerik_oyunculari_yonetmen ON icerik_oyunculari(icerik_id) WHERE rol_tipi = 'yonetmen';

-- =====================================================
-- MEVCUT VERİLERİ MİGRASYON (MetaVeri'den oyuncu çek)
-- Bu kısım opsiyonel - backend'den de yapılabilir
-- =====================================================

-- Not: Mevcut meta_veri JSON'larından oyuncu bilgilerini çekmek için
-- backend'de bir migration endpoint kullanılabilir.
-- Örnek: POST /api/seed/migrate-actors

COMMENT ON TABLE oyuncular IS 'Film ve dizi oyuncuları';
COMMENT ON TABLE icerik_oyunculari IS 'İçerik-oyuncu ilişki tablosu (cast & crew)';
COMMENT ON COLUMN icerik_oyunculari.rol_tipi IS 'oyuncu, yonetmen, yapimci, senarist';
COMMENT ON COLUMN icerik_oyunculari.sira IS 'Kredilerdeki sıralama numarası';
