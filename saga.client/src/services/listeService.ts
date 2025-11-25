import api from './api';

// Types
export interface ListeCreateDto {
  ad: string;
  aciklama?: string;
  herkeseAcik?: boolean;
  tur?: 'sistem' | 'ozel';
}

export interface ListeUpdateDto {
  ad: string;
  aciklama?: string;
  herkeseAcik: boolean;
}

export interface ListeIcerikItemDto {
  icerikId: number;
  baslik: string;
  tur: string;
  posterUrl?: string;
  ortalamaPuan: number;
  sira: number;
  notMetni?: string;
  eklenmeZamani: string;
}

export interface ListeDetailDto {
  id: number;
  kullaniciId: string;
  kullaniciAdi: string;
  ad: string;
  tur: string;
  aciklama?: string;
  herkeseAcik: boolean;
  icerikSayisi: number;
  olusturulmaZamani: string;
  guncellemeZamani: string;
  icerikler: ListeIcerikItemDto[];
}

export interface ListeListDto {
  id: number;
  kullaniciAdi: string;
  ad: string;
  tur: string;
  icerikSayisi: number;
  herkeseAcik: boolean;
  olusturulmaZamani: string;
}

export interface ListeIcerikEkleDto {
  icerikId: number;
  sira?: number;
  notMetni?: string;
}

export interface ListeIcerikGuncelleDto {
  sira: number;
  notMetni?: string;
}

// API Functions
export const listeService = {
  // Yeni liste oluştur
  create: async (data: ListeCreateDto): Promise<ListeDetailDto> => {
    const response = await api.post('/liste', data);
    return response.data;
  },

  // Liste güncelle
  update: async (id: number, data: ListeUpdateDto): Promise<ListeDetailDto> => {
    const response = await api.put(`/liste/${id}`, data);
    return response.data;
  },

  // Liste sil
  delete: async (id: number): Promise<void> => {
    await api.delete(`/liste/${id}`);
  },

  // Liste detayını getir
  getById: async (id: number): Promise<ListeDetailDto> => {
    const response = await api.get(`/liste/${id}`);
    return response.data;
  },

  // Kullanıcının listelerini getir
  getMyLists: async (params?: {
    tur?: string;
    page?: number;
    limit?: number;
  }): Promise<ListeListDto[]> => {
    const response = await api.get('/liste', { params });
    return response.data;
  },

  // Belirli bir kullanıcının listelerini getir
  getUserLists: async (
    kullaniciId: string,
    params?: {
      tur?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ListeListDto[]> => {
    const response = await api.get(`/liste/kullanici/${kullaniciId}`, { params });
    return response.data;
  },

  // Herkese açık listeleri getir
  getPublicLists: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ListeListDto[]> => {
    const response = await api.get('/liste/genel', { params });
    return response.data;
  },

  // Listeye içerik ekle
  addContent: async (listeId: number, data: ListeIcerikEkleDto): Promise<void> => {
    await api.post(`/liste/${listeId}/icerik`, data);
  },

  // Listedeki içeriği güncelle
  updateContent: async (listeId: number, icerikId: number, data: ListeIcerikGuncelleDto): Promise<void> => {
    await api.put(`/liste/${listeId}/icerik/${icerikId}`, data);
  },

  // Listeden içerik sil
  removeContent: async (listeId: number, icerikId: number): Promise<void> => {
    await api.delete(`/liste/${listeId}/icerik/${icerikId}`);
  },

  // Belirli bir içeriğin hangi listelerde olduğunu getir
  getContentLists: async (icerikId: number): Promise<ListeListDto[]> => {
    const response = await api.get(`/liste/icerik/${icerikId}`);
    return response.data;
  },
};
