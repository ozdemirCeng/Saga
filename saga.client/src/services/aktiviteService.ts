import api from './api';

// Types
export interface AktiviteVeriDto {
  baslik?: string;
  posterUrl?: string;
  tur?: string;
  puan?: number;
  yorumOzet?: string;
  listeAdi?: string;
  takipEdilenKullaniciAdi?: string;
  takipEdilenAvatar?: string;
  durum?: string;
}

export interface AktiviteFeedDto {
  id: number;
  kullaniciId: string;
  kullaniciAdi: string;
  kullaniciAvatar?: string;
  aktiviteTuru: 'puanlama' | 'yorum' | 'listeye_ekleme' | 'takip' | 'durum_guncelleme';
  olusturulmaZamani: string;
  veri?: AktiviteVeriDto;
}

export interface AktiviteDto {
  id: number;
  kullaniciId: string;
  kullaniciAdi: string;
  avatarUrl?: string;
  aktiviteTuru: string;
  icerikId?: number;
  icerikBaslik?: string;
  posterUrl?: string;
  yorumId?: number;
  puanlamaId?: number;
  puan?: number;
  listeId?: number;
  listeAdi?: string;
  veri?: string;
  olusturulmaZamani: string;
}

export interface FeedFilterDto {
  kullaniciId?: string;
  aktiviteTuru?: string;
  sadeceTabipEdilenler?: boolean;
  page?: number;
  limit?: number;
}

// API Functions
export const aktiviteService = {
  // Ana feed (takip edilenler + kendi)
  getFeed: async (params?: FeedFilterDto): Promise<AktiviteFeedDto[]> => {
    const response = await api.get('/aktivite/feed', { params });
    return response.data;
  },

  // Belirli bir kullanıcının aktiviteleri
  getUserActivities: async (
    kullaniciId: string,
    params?: {
      aktiviteTuru?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<AktiviteDto[]> => {
    const response = await api.get(`/aktivite/kullanici/${kullaniciId}`, { params });
    return response.data;
  },

  // Kendi aktivitelerim
  getMyActivities: async (params?: {
    aktiviteTuru?: string;
    page?: number;
    limit?: number;
  }): Promise<AktiviteDto[]> => {
    const response = await api.get('/aktivite', { params });
    return response.data;
  },

  // Belirli bir içeriğe ait aktiviteler
  getContentActivities: async (
    icerikId: number,
    params?: {
      aktiviteTuru?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<AktiviteFeedDto[]> => {
    const response = await api.get(`/aktivite/icerik/${icerikId}`, { params });
    return response.data;
  },

  // Belirli bir aktiviteyi sil (sadece kendi aktivitelerin)
  delete: async (id: number): Promise<void> => {
    await api.delete(`/aktivite/${id}`);
  },
};
