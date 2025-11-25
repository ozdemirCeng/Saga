import api from './api';

// Backend'den gelen veri tipleri
export interface Icerik {
    id: number;
    baslik: string;
    tur: 'film' | 'kitap';
    posterUrl: string | null;
    ortalamaPuan: number;
    populerlikSkoru?: number;
    yayinTarihi?: string;
}

export interface IcerikDetay extends Icerik {
    aciklama: string | null;
    yonetmen?: string;
    oyuncular?: string[];
    kullaniciPuani?: number; // Kullanıcının verdiği puan
    kullanicininDurumu?: string; // izlendi/okundu vs.
}

export const icerikService = {
    // Tüm içerikleri getir (Keşfet sayfası için)
    getAll: async (page = 1, limit = 20) => {
        const response = await api.get<Icerik[]>('/icerikler', {
            params: { page, limit }
        });
        return response.data;
    },

    // Popüler içerikleri getir (Ana sayfa vitrini için)
    getPopular: async () => {
        const response = await api.get<Icerik[]>('/icerik/populer');
        return response.data;
    },

    // İçerik detayını getir
    getById: async (id: string) => {
        const response = await api.get<IcerikDetay>(`/icerik/${id}`);
        return response.data;
    },

    // Arama yap
    search: async (query: string) => {
        const response = await api.get<Icerik[]>('/icerik/ara', {
            params: { q: query }
        });
        return response.data;
    }
};