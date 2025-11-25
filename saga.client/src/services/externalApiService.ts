import api from './api';

export interface ExternalFilm {
    id: string;
    baslik: string;
    aciklama: string;
    posterUrl: string;
    yayinTarihi: string;
    puan: number;
}

export interface ExternalBook {
    id: string;
    baslik: string;
    aciklama: string;
    posterUrl: string;
    yayinTarihi: string;
    yazarlar: string[];
}

export const externalApiService = {
    // TMDB Film Arama
    searchTmdbFilms: async (query: string, page = 1) => {
        const response = await api.get<ExternalFilm[]>('/externalapi/tmdb/search', {
            params: { q: query, sayfa: page }
        });
        return response.data;
    },

    // TMDB Popüler Filmler
    getPopularTmdbFilms: async (page = 1) => {
        const response = await api.get<ExternalFilm[]>('/externalapi/tmdb/popular', {
            params: { sayfa: page }
        });
        return response.data;
    },

    // TMDB En Yüksek Puanlı Filmler
    getTopRatedTmdbFilms: async (page = 1) => {
        const response = await api.get<ExternalFilm[]>('/externalapi/tmdb/top-rated', {
            params: { sayfa: page }
        });
        return response.data;
    },

    // TMDB Film Detayı
    getTmdbFilm: async (id: string) => {
        const response = await api.get<ExternalFilm>(`/externalapi/tmdb/${id}`);
        return response.data;
    },

    // Google Books Arama
    searchGoogleBooks: async (query: string, startIndex = 0, limit = 20) => {
        const response = await api.get<ExternalBook[]>('/externalapi/books/search', {
            params: { q: query, baslangic: startIndex, limit }
        });
        return response.data;
    },

    // Google Books Detayı
    getGoogleBook: async (id: string) => {
        const response = await api.get<ExternalBook>(`/externalapi/books/${id}`);
        return response.data;
    },
};
