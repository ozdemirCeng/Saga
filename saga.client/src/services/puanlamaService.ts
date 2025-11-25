import api from './api';

export const puanlamaService = {
    // Puan Ver (POST)
    addPuan: async (icerikId: number, puan: number) => {
        const response = await api.post('/puanlama', {
            icerikId,
            puan
        });
        return response.data;
    },

    // Puan Güncelle (PUT)
    updatePuan: async (id: number, puan: number) => {
        const response = await api.put(`/puanlama/${id}`, {
            puan
        });
        return response.data;
    },

    // Benim bu içeriğe verdiğim puanı getir
    getMyRating: async (icerikId: number) => {
        const response = await api.get(`/puanlama/icerik/${icerikId}/benim`);
        return response.data;
    },

    // İçeriğin genel puan istatistikleri
    getStats: async (icerikId: number) => {
        const response = await api.get(`/puanlama/icerik/${icerikId}/istatistik`);
        return response.data;
    }
};