import api from './api';

// Sayfalama response tipi
export interface PaginatedResponse<T> {
    data: T[];
    toplamSayfa: number;
    toplamKayit: number;
    mevcutSayfa?: number;
}

// Backend'den gelen veri tipleri
export interface Icerik {
    id: number;
    baslik: string;
    tur: 'film' | 'kitap' | 'dizi';
    aciklama?: string | null;
    posterUrl: string | null;
    ortalamaPuan: number;
    hariciPuan?: number; // IMDB/TMDB/Google Books puanı
    hariciOySayisi?: number;
    puanlamaSayisi?: number;
    populerlikSkoru?: number;
    yayinTarihi?: string;
}

// Oyuncu bilgisi
export interface OyuncuInfo {
    ad: string;
    karakter?: string;
    profilUrl?: string;
}

export interface IcerikDetay extends Icerik {
    aciklama: string | null;
    yonetmen?: string;
    oyuncular?: OyuncuInfo[];
    hariciPuan: number; // IMDB/TMDB/Google Books puanı
    hariciOySayisi: number;
    puanlamaSayisi: number;
    yorumSayisi?: number;
    listeyeEklenmeSayisi?: number;
    goruntulemeSayisi?: number;
    kullaniciPuani?: number; // Kullanıcının verdiği puan
    kullanicininDurumu?: string; // izlendi/okundu vs.
    // Film/Dizi meta verileri
    turler?: string[];
    sure?: number;
    sezonSayisi?: number;
    bolumSayisi?: number;
    // Kitap meta verileri
    yazarlar?: string[];
    sayfaSayisi?: number;
    yayinevi?: string;
    isbn?: string;
    kategoriler?: string[];
}

export const icerikService = {
    // Tüm içerikleri getir (Keşfet sayfası için)
    getAll: async (page = 1, limit = 50) => {
        const response = await api.get<Icerik[]>('/icerikler', {
            params: { page, limit }
        });
        return response.data;
    },

    // Popüler içerikleri getir (Ana sayfa vitrini için)
    getPopular: async () => {
        const response = await api.get<Icerik[]>('/icerik/populer', { params: { limit: 50 } });
        return response.data;
    },

    // İçerik detayını getir
    getById: async (id: number) => {
        const response = await api.get<IcerikDetay>(`/icerik/${id}`);
        return response.data;
    },

    // Arama yap
    search: async (query: string) => {
        const response = await api.get<Icerik[]>('/icerik/ara', {
            params: { q: query }
        });
        return response.data;
    },

    // Filtreli arama (backend doğrudan Icerik[] döndürür)
    filter: async (params: {
        tur?: 'film' | 'kitap';
        turler?: string[]; // Film türleri veya kitap kategorileri (şimdilik backend tarafında kullanılmıyor)
        minPuan?: number;
        maxPuan?: number;
        yil?: number;
        minYil?: number;
        maxYil?: number;
        page?: number;
        limit?: number;
    }) => {
        // Default limit 50
        const finalParams = { limit: 50, ...params };
        const response = await api.get<Icerik[]>('/icerik/filtrele', { params: finalParams });
        return response.data;
    },

    // Filtreli arama - sayfalama desteği ile
    filterPaginated: async (params: {
        tur?: 'film' | 'kitap';
        turler?: string[];
        minPuan?: number;
        maxPuan?: number;
        yil?: number;
        minYil?: number;
        maxYil?: number;
        sayfa?: number;
        limit?: number;
    }): Promise<PaginatedResponse<Icerik>> => {
        const finalParams = { limit: 50, sayfa: 1, ...params };
        const response = await api.get<Icerik[]>('/icerik/filtrele', { params: finalParams });
        
        // Axios header'ları lowercase yapar
        const toplamSayfaStr = response.headers['x-toplam-sayfa'];
        const toplamKayitStr = response.headers['x-toplam-kayit'];
        
        const toplamSayfa = parseInt(toplamSayfaStr || '1', 10);
        const toplamKayit = parseInt(toplamKayitStr || '0', 10);
        
        return {
            data: response.data,
            toplamSayfa,
            toplamKayit,
            mevcutSayfa: finalParams.sayfa,
        };
    },

    // Arama - sayfalama desteği ile
    searchPaginated: async (query: string, params?: { sayfa?: number; limit?: number }): Promise<PaginatedResponse<Icerik>> => {
        const finalParams = { limit: 50, sayfa: 1, ...params };
        const response = await api.get<Icerik[]>('/icerik/ara', {
            params: { q: query, ...finalParams }
        });
        return {
            data: response.data,
            toplamSayfa: parseInt(response.headers['x-toplam-sayfa'] || '1'),
            toplamKayit: parseInt(response.headers['x-toplam-kayit'] || '0'),
            mevcutSayfa: finalParams.sayfa,
        };
    },

    // En yüksek puanlılar
    getTopRated: async (params?: { tur?: 'film' | 'kitap'; limit?: number }) => {
        const finalParams = { limit: 50, ...params };
        const response = await api.get<Icerik[]>('/icerik/en-yuksek-puanlilar', { params: finalParams });
        return response.data;
    },

    // Yeni içerikler
    getRecent: async (params?: { tur?: 'film' | 'kitap'; limit?: number }) => {
        const finalParams = { limit: 50, ...params };
        const response = await api.get<Icerik[]>('/icerik/yeni', { params: finalParams });
        return response.data;
    },

    // Önerilen içerikler (login gerekli)
    getRecommended: async (params?: { limit?: number }) => {
        const finalParams = { limit: 50, ...params };
        const response = await api.get<Icerik[]>('/icerik/onerilenler', { params: finalParams });
        return response.data;
    }
};