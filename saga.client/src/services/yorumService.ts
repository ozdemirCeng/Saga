import api from './api';

export interface YorumCreateDto {
    icerikId: number;
    icerik: string;
    puan?: number;
    spoilerIceriyor: boolean;
}

export const yorumService = {
    // Yorum Ekle
    addYorum: async (data: YorumCreateDto) => {
        const response = await api.post('/yorum', data);
        return response.data;
    },

    // Bir içeriğe ait yorumları getir
    getByIcerik: async (icerikId: number, page = 1) => {
        const response = await api.get(`/yorum/icerik/${icerikId}`, {
            params: { sayfa: page }
        });
        return response.data;
    },

    // Yorumu Beğen / Beğeniyi Kaldır
    toggleLike: async (yorumId: number) => {
        const response = await api.post(`/yorum/${yorumId}/begeni`);
        return response.data;
    },

    // Yorumu Sil
    deleteYorum: async (id: number) => {
        await api.delete(`/yorum/${id}`);
    }
};