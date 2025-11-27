import axios from 'axios';
import { supabase } from './supabase';

// Backend'in çalıştığı adres
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5054/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// REQUEST INTERCEPTOR: İstek gönderilmeden hemen önce araya girer
api.interceptors.request.use(async (config) => {
    // 1. Supabase'den güncel oturum bilgisini al
    const { data } = await supabase.auth.getSession();

    // 2. Eğer kullanıcı giriş yapmışsa, Token'ı başlığa ekle
    if (data.session?.access_token) {
        config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// RESPONSE INTERCEPTOR: Cevap geldikten hemen sonra araya girer
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    // Hata yönetimi
    const message = error.response?.data?.message || 'Bir hata oluştu.';

    // 401 (Yetkisiz) hatası gelirse konsola bas
    if (error.response?.status === 401) {
        console.warn("Oturum süresi dolmuş veya yetkisiz erişim.");
    } else {
        console.error('API Error:', message);
    }

    return Promise.reject(error);
});

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AktiviteVeri {
    baslik?: string;
    icerikAdi?: string;
    posterUrl?: string;
    tur?: string;
    puan?: number;
    yorumOzet?: string;
    listeAdi?: string;
    takipEdilenKullaniciAdi?: string;
    takipEdilenAvatar?: string;
    durum?: string;
}

export interface Aktivite {
    id: number;
    kullaniciId: string;
    kullaniciAdi: string;
    kullaniciAvatar?: string;
    aktiviteTipi?: number;
    aktiviteTipiStr?: string;
    aktiviteTuru?: 'puanlama' | 'yorum' | 'listeye_ekleme' | 'takip' | 'durum_guncelleme';
    icerikId?: number;
    icerikTur?: string;
    olusturulmaZamani: string;
    // Yeni istatistik alanları
    begeniSayisi?: number;
    yorumSayisi?: number;
    paylasimSayisi?: number;
    begendim?: boolean;
    veri?: AktiviteVeri;
}

// Aktivite yorumu
export interface AktiviteYorum {
    id: number;
    aktiviteId: number;
    kullaniciId: string;
    kullaniciAdi: string;
    kullaniciAvatar?: string;
    icerik: string;
    ustYorumId?: number;
    begeniSayisi: number;
    begendim: boolean;
    olusturulmaZamani: string;
    yanitlar?: AktiviteYorum[];
}

// Aktivite beğeni
export interface AktiviteBegeni {
    aktiviteId: number;
    kullaniciId: string;
    kullaniciAdi: string;
    avatarUrl?: string;
    olusturulmaZamani: string;
}

// Kullanıcı ayarları
export interface KullaniciAyarlari {
    bildirimYeniTakipci: boolean;
    bildirimYorumlar: boolean;
    bildirimBegeniler: boolean;
    bildirimOneriler: boolean;
    bildirimEmail: boolean;
    profilGizli: boolean;
    aktiviteGizli: boolean;
    tema: string;
    dil: string;
}

export interface OyuncuInfo {
    ad: string;
    karakter?: string;
    profilUrl?: string;
}

export interface Icerik {
    id: number;
    hariciId: string;
    apiKaynagi: string;
    tur: 'film' | 'kitap';
    baslik: string;
    aciklama?: string;
    posterUrl?: string;
    yayinTarihi?: string;
    ortalamaPuan: number;
    puanlamaSayisi: number;
    hariciPuan: number; // TMDB/IMDB puanı
    hariciOySayisi: number;
    yorumSayisi: number;
    listeyeEklenmeSayisi: number;
    goruntulemeSayisi: number;
    populerlikSkoru: number;
    olusturulmaZamani: string;
    kullaniciPuani?: number;
    kullanicininDurumu?: string;
    
    // Film/Dizi meta verileri
    yonetmen?: string;
    oyuncular?: OyuncuInfo[];
    turler?: string[];
    sure?: number; // Dakika
    sezonSayisi?: number;
    bolumSayisi?: number;
    
    // Kitap meta verileri
    yazarlar?: string[];
    sayfaSayisi?: number;
    yayinevi?: string;
    isbn?: string;
    kategoriler?: string[];
}

export interface IcerikListItem {
    id: number;
    baslik: string;
    tur: string;
    aciklama?: string;
    posterUrl?: string;
    ortalamaPuan: number;
    puanlamaSayisi?: number;
    hariciPuan?: number; // TMDB/IMDB puanı
    hariciOySayisi?: number;
    populerlikSkoru?: number;
    yayinTarihi?: string;
}

export interface Yorum {
    id: number;
    icerikId: number;
    kullaniciId: string;
    kullaniciAdi: string;
    kullaniciAvatar?: string;
    baslik?: string;
    icerik?: string;
    icerikOzet?: string;
    puan?: number;
    spoilerIceriyor: boolean;
    begeniSayisi: number;
    kullaniciBegendiMi: boolean;
    olusturulmaZamani: string;
    guncellemeZamani?: string;
    ustYorumId?: number;
    yanitlar?: Yorum[];
}

export interface YorumCreateDto {
    icerikId: number;
    baslik?: string;
    icerik: string;
    puan?: number;
    spoilerIceriyor?: boolean;
    ustYorumId?: number;
}

export interface Puanlama {
    id: number;
    kullaniciId: string;
    icerikId: number;
    puan: number;
    olusturulmaZamani: string;
}

export interface PuanlamaCreateDto {
    icerikId: number;
    puan: number;
}

export interface Kullanici {
    id: string;
    kullaniciAdi: string;
    eposta?: string;
    goruntulemeAdi?: string;
    biyografi?: string;
    avatarUrl?: string;
    rol?: string;
    olusturulmaZamani: string;
    // İstatistikler
    toplamPuanlama: number;
    toplamYorum: number;
    toplamListe: number;
    takipEdenSayisi: number;
    takipEdilenSayisi: number;
    takipEdiyorMu?: boolean;
}

// Akıllı Öneri Sistemi - Benzer içerik türleriyle ilgilenen kullanıcı önerileri
export interface OnerilenKullanici {
    id: string;
    kullaniciAdi: string;
    goruntulemeAdi?: string;
    avatarUrl?: string;
    takipEdenSayisi: number;
    toplamPuanlama: number;
    ortakIcerikSayisi: number;
    oneriNedeni: string; // "5 ortak içerik", "Film ilgisi", "Kitap ilgisi", "Popüler kullanıcı" vb.
}

export interface KutuphaneDurumu {
    id?: number;
    kullaniciId?: string;
    icerikId: number;
    icerik?: IcerikListItem;
    // Backend KutuphaneListDto alanları
    baslik?: string;
    tur?: string;
    posterUrl?: string;
    ortalamaPuan?: number;
    durum: string;
    ilerleme?: number;
    guncellemeZamani?: string;
    // Eski alan adları (uyumluluk)
    icerikAdi?: string;
    icerikTur?: string;
    durumStr?: string;
    olusturulmaZamani?: string;
}

export interface TmdbFilm {
    id: string;
    // Backend Türkçe alan adları
    baslik?: string;
    aciklama?: string;
    posterUrl?: string;
    yayinTarihi?: string;
    puan?: number;
    oySayisi?: number;
    mediaType?: 'movie' | 'tv'; // Film mi dizi mi
    turIds?: number[]; // Tür ID'leri (TMDB genre IDs)
    turler?: string[]; // Tür adları
    // Alternatif alanlar (uyumluluk için)
    title?: string;
    overview?: string;
    posterPath?: string;
    releaseDate?: string;
    voteAverage?: number;
    voteCount?: number;
}

export interface GoogleBook {
    id: string;
    baslik: string;
    yazarlar?: string[];
    aciklama?: string;
    posterUrl?: string;
    yayinTarihi?: string;
    ortalamaPuan?: number;
    oySayisi?: number;
    // Alternatif alanlar (frontend uyumluluğu için)
    title?: string;
    authors?: string[];
    description?: string;
    thumbnail?: string;
    publishedDate?: string;
    averageRating?: number;
    ratingsCount?: number;
}

// ============================================
// AKTIVITE API
// ============================================

export const aktiviteApi = {
    // Takip edilen kullanıcıların feed'i (auth gerekli)
    getFeed: async (params?: { aktiviteTuru?: string; sayfa?: number; limit?: number }) => {
        const response = await api.get<Aktivite[]>('/aktivite/feed', { params });
        return {
            data: response.data,
            toplamSayfa: parseInt(response.headers['x-toplam-sayfa'] || '1'),
            toplamKayit: parseInt(response.headers['x-toplam-kayit'] || '0'),
        };
    },

    // Genel feed (herkese açık)
    getGenelFeed: async (params?: { aktiviteTuru?: string; sayfa?: number; limit?: number }) => {
        const response = await api.get<Aktivite[]>('/aktivite/genel', { params });
        return {
            data: response.data,
            toplamSayfa: parseInt(response.headers['x-toplam-sayfa'] || '1'),
            toplamKayit: parseInt(response.headers['x-toplam-kayit'] || '0'),
        };
    },

    // Kullanıcının aktiviteleri (GUID id ile)
    getKullaniciAktiviteleri: async (
        kullaniciId: string,
        params?: { aktiviteTuru?: string; sayfa?: number; limit?: number; sayfaBoyutu?: number }
    ) => {
        // sayfaBoyutu'nu limit'e dönüştür
        const queryParams = {
            ...params,
            limit: params?.limit || params?.sayfaBoyutu,
        };
        delete (queryParams as any).sayfaBoyutu;
        const response = await api.get<Aktivite[]>(`/kullanici/${kullaniciId}/aktiviteler`, { params: queryParams });
        return {
            data: response.data,
            toplamSayfa: parseInt(response.headers['x-toplam-sayfa'] || '1'),
            toplamKayit: parseInt(response.headers['x-toplam-kayit'] || '0'),
        };
    },

    // Aktivite sil
    deleteAktivite: async (aktiviteId: number) => {
        await api.delete(`/aktivite/${aktiviteId}`);
    },
    
    // Aktivite beğen/beğeniyi kaldır
    toggleBegeni: async (aktiviteId: number) => {
        const response = await api.post<{ begendim: boolean; begeniSayisi: number }>(`/aktivite/${aktiviteId}/begen`);
        return response.data;
    },
    
    // Aktivite beğenilerini getir
    getBegeniler: async (aktiviteId: number, limit = 20) => {
        const response = await api.get<AktiviteBegeni[]>(`/aktivite/${aktiviteId}/begeniler`, { params: { limit } });
        return response.data;
    },
    
    // Aktivite yorumları getir
    getYorumlar: async (aktiviteId: number, params?: { sayfa?: number; limit?: number }) => {
        const response = await api.get<AktiviteYorum[]>(`/aktivite/${aktiviteId}/yorumlar`, { params });
        return {
            data: response.data,
            toplamSayfa: parseInt(response.headers['x-toplam-sayfa'] || '1'),
            toplamKayit: parseInt(response.headers['x-toplam-kayit'] || '0'),
        };
    },
    
    // Aktiviteye yorum ekle
    yorumEkle: async (aktiviteId: number, data: { icerik: string; ustYorumId?: number }) => {
        const response = await api.post<AktiviteYorum>(`/aktivite/${aktiviteId}/yorum`, data);
        return response.data;
    },
    
    // Aktivite yorumunu beğen
    yorumBegen: async (yorumId: number) => {
        const response = await api.post<{ begendim: boolean; begeniSayisi: number }>(`/aktivite/yorum/${yorumId}/begen`);
        return response.data;
    },
    
    // Aktivite yorumunu sil
    yorumSil: async (yorumId: number) => {
        await api.delete(`/aktivite/yorum/${yorumId}`);
    },
};

// ============================================
// AYARLAR API
// ============================================

export const ayarlarApi = {
    // Kullanıcı ayarlarını getir
    getAyarlar: async () => {
        const response = await api.get<KullaniciAyarlari>('/ayarlar');
        return response.data;
    },
    
    // Ayarları güncelle
    updateAyarlar: async (data: Partial<KullaniciAyarlari>) => {
        const response = await api.put<KullaniciAyarlari>('/ayarlar', data);
        return response.data;
    },
    
    // Bildirim ayarlarını güncelle
    updateBildirimler: async (data: {
        bildirimYeniTakipci?: boolean;
        bildirimYorumlar?: boolean;
        bildirimBegeniler?: boolean;
        bildirimOneriler?: boolean;
        bildirimEmail?: boolean;
    }) => {
        await api.put('/ayarlar/bildirimler', data);
    },
    
    // Gizlilik ayarlarını güncelle
    updateGizlilik: async (data: {
        profilGizli?: boolean;
        aktiviteGizli?: boolean;
    }) => {
        await api.put('/ayarlar/gizlilik', data);
    },
};

// ============================================
// ICERIK API
// ============================================

export const icerikApi = {
    // İçerik detayı
    getById: async (id: number) => {
        const response = await api.get<Icerik>(`/icerik/${id}`);
        return response.data;
    },

    // İçerik ara
    ara: async (q: string, params?: { tur?: string; sayfa?: number; limit?: number }) => {
        const response = await api.get<IcerikListItem[]>('/icerik/ara', { params: { q, ...params } });
        return {
            data: response.data,
            toplamSayfa: parseInt(response.headers['x-toplam-sayfa'] || '1'),
            toplamKayit: parseInt(response.headers['x-toplam-kayit'] || '0'),
        };
    },

    // Filtreli içerikler
    filtrele: async (params?: {
        tur?: string;
        yil?: number;
        minPuan?: number;
        maxPuan?: number;
        sayfa?: number;
        limit?: number;
    }) => {
        const response = await api.get<IcerikListItem[]>('/icerik/filtrele', { params });
        return {
            data: response.data,
            toplamSayfa: parseInt(response.headers['x-toplam-sayfa'] || '1'),
            toplamKayit: parseInt(response.headers['x-toplam-kayit'] || '0'),
        };
    },

    // Popüler içerikler
    getPopuler: async (params?: { tur?: string; limit?: number }) => {
        const response = await api.get<IcerikListItem[]>('/icerik/populer', { params });
        return response.data;
    },

    // En yüksek puanlılar
    getEnYuksekPuanlilar: async (params?: { tur?: string; limit?: number }) => {
        const response = await api.get<IcerikListItem[]>('/icerik/en-yuksek-puanlilar', { params });
        return response.data;
    },

    // Yeni içerikler
    getYeni: async (params?: { tur?: string; limit?: number }) => {
        const response = await api.get<IcerikListItem[]>('/icerik/yeni', { params });
        return response.data;
    },

    // Önerilen içerikler (auth gerekli)
    getOnerilenler: async (limit?: number) => {
        const response = await api.get<IcerikListItem[]>('/icerik/onerilenler', { params: { limit } });
        return response.data;
    },
};

// ============================================
// YORUM API
// ============================================

export const yorumApi = {
    // Yorum oluştur
    create: async (dto: YorumCreateDto) => {
        const response = await api.post<Yorum>('/yorum', dto);
        return response.data;
    },

    // Yorum getir
    getById: async (id: number) => {
        const response = await api.get<Yorum>(`/yorum/${id}`);
        return response.data;
    },

    // Yorum güncelle
    update: async (id: number, dto: Partial<YorumCreateDto>) => {
        const response = await api.put<Yorum>(`/yorum/${id}`, dto);
        return response.data;
    },

    // Yorum sil
    delete: async (id: number) => {
        await api.delete(`/yorum/${id}`);
    },

    // İçeriğin yorumları
    getIcerikYorumlari: async (icerikId: number, params?: { sayfa?: number; sayfaBoyutu?: number }) => {
        const response = await api.get<Yorum[]>(`/yorum/icerik/${icerikId}`, { params });
        return {
            data: response.data,
            toplamSayfa: parseInt(response.headers['x-toplam-sayfa'] || '1'),
            toplamKayit: parseInt(response.headers['x-toplam-kayit'] || '0'),
        };
    },

    // Beğeni toggle
    toggleBegeni: async (yorumId: number) => {
        const response = await api.post<{ begendi: boolean; begeniSayisi: number }>(
            `/yorum/${yorumId}/begeni`
        );
        return response.data;
    },
};

// ============================================
// PUANLAMA API
// ============================================

export const puanlamaApi = {
    // Puanlama oluştur veya güncelle (önce kontrol et)
    puanla: async (dto: PuanlamaCreateDto) => {
        try {
            // Önce mevcut puanlamayı kontrol et
            const mevcut = await puanlamaApi.getKullaniciPuani(dto.icerikId);
            if (mevcut) {
                // Güncelle
                const response = await api.put<Puanlama>(`/puanlama/${mevcut.id}`, { puan: dto.puan });
                return response.data;
            }
        } catch {
            // Puanlama yok, yeni oluştur
        }
        // Yeni puanlama oluştur
        const response = await api.post<Puanlama>('/puanlama', dto);
        return response.data;
    },

    // Kullanıcının puanlaması
    getKullaniciPuani: async (icerikId: number) => {
        try {
            const response = await api.get<Puanlama>(`/puanlama/icerik/${icerikId}/benim`);
            return response.data;
        } catch {
            return null;
        }
    },

    // Puanlama sil
    delete: async (id: number) => {
        await api.delete(`/puanlama/${id}`);
    },
};

// ============================================
// KUTUPHANE API
// ============================================

export interface Liste {
    id: number;
    kullaniciId?: string;
    kullaniciAdi: string;
    ad: string;
    tur: 'ozel' | 'sistem';
    aciklama?: string;
    herkeseAcik: boolean;
    icerikSayisi: number;
    olusturulmaZamani: string;
    guncellemeZamani?: string;
    icerikler?: ListeIcerik[];
}

export interface ListeIcerik {
    icerikId: number;
    baslik: string;
    tur: string;
    posterUrl?: string;
    ortalamaPuan: number;
    sira: number;
    notMetni?: string;
    eklenmeZamani: string;
}

export interface ListeCreateDto {
    ad: string;
    tur?: string;
    aciklama?: string;
    herkeseAcik?: boolean;
}

export const kutuphaneApi = {
    // Kütüphaneye ekle/güncelle (önce kontrol et)
    durumGuncelle: async (icerikId: number, durum: string) => {
        try {
            // Önce mevcut durumu kontrol et
            const mevcut = await kutuphaneApi.getDurum(icerikId);
            if (mevcut) {
                // Güncelle
                const response = await api.put<KutuphaneDurumu>(`/kutuphane/${mevcut.id}`, { durum });
                return response.data;
            }
        } catch {
            // Durum yok, yeni oluştur
        }
        // Yeni durum oluştur
        const response = await api.post<KutuphaneDurumu>('/kutuphane', { icerikId, durum });
        return response.data;
    },

    // Kullanıcının kütüphanesi (ID ile)
    getKutuphane: async (
        kullaniciId: string,
        params?: { durum?: string; tur?: string; sayfa?: number; limit?: number }
    ) => {
        const response = await api.get<KutuphaneDurumu[]>(`/kutuphane/kullanici/${kullaniciId}`, {
            params,
        });
        return response.data;
    },

    // Kullanıcının kütüphanesi (GUID id ile) - sayfalı
    getKullanicininKutuphanesi: async (
        kullaniciId: string,
        params?: { durum?: string; tur?: string; sayfa?: number; sayfaBoyutu?: number }
    ) => {
        const response = await api.get<KutuphaneDurumu[]>(`/kutuphane/kullanici/${kullaniciId}`, {
            params,
        });
        return {
            data: response.data,
            toplamSayfa: parseInt(response.headers['x-toplam-sayfa'] || '1'),
            toplamKayit: parseInt(response.headers['x-toplam-kayit'] || '0'),
        };
    },

    // İçeriğin durumu
    getDurum: async (icerikId: number) => {
        try {
            const response = await api.get<KutuphaneDurumu>(`/kutuphane/icerik/${icerikId}`);
            return response.data;
        } catch {
            return null;
        }
    },

    // Kütüphaneden kaldır
    kaldir: async (icerikId: number) => {
        await api.delete(`/kutuphane/icerik/${icerikId}`);
    },
};

// ============================================
// LISTE API - Proje İsteri 2.1.5
// ============================================

export const listeApi = {
    // Kullanıcının kendi listeleri
    getMyListeler: async () => {
        const response = await api.get<Liste[]>('/liste');
        return response.data;
    },

    // Liste oluştur
    create: async (dto: ListeCreateDto) => {
        const response = await api.post<Liste>('/liste', { ...dto, tur: dto.tur || 'ozel' });
        return response.data;
    },

    // Liste detayı
    getById: async (id: number) => {
        const response = await api.get<Liste>(`/liste/${id}`);
        return response.data;
    },

    // Liste güncelle
    update: async (id: number, dto: { ad: string; aciklama?: string; herkeseAcik?: boolean }) => {
        const response = await api.put<Liste>(`/liste/${id}`, dto);
        return response.data;
    },

    // Liste sil
    delete: async (id: number) => {
        await api.delete(`/liste/${id}`);
    },

    // Kullanıcının listeleri (GUID id ile)
    getKullaniciListeleri: async (kullaniciId: string) => {
        const response = await api.get<Liste[]>(`/liste/kullanici/${kullaniciId}`);
        return response.data;
    },

    // İçeriğin listeleri (hangi listelerde var)
    getIcerikListeleri: async (icerikId: number) => {
        const response = await api.get<Liste[]>(`/liste/icerik/${icerikId}`);
        return response.data;
    },

    // Listeye içerik ekle
    addIcerik: async (listeId: number, icerikId: number, sira?: number, notMetni?: string) => {
        const response = await api.post(`/liste/${listeId}/icerik`, { icerikId, sira, notMetni });
        return response.data;
    },

    // Liste içeriği güncelle
    updateIcerik: async (listeId: number, icerikId: number, dto: { sira?: number; notMetni?: string }) => {
        const response = await api.put(`/liste/${listeId}/icerik/${icerikId}`, dto);
        return response.data;
    },

    // Listeden içerik çıkar
    removeIcerik: async (listeId: number, icerikId: number) => {
        const response = await api.delete(`/liste/${listeId}/icerik/${icerikId}`);
        return response.data;
    },

    // Liste paylaş
    paylas: async (listeId: number) => {
        const response = await api.post<{ listeId: number; listeAdi: string; paylasimUrl: string }>(`/liste/${listeId}/paylas`);
        return response.data;
    },

    // Liste gizlilik toggle
    toggleGizlilik: async (listeId: number) => {
        const response = await api.post<{ herkeseAcik: boolean }>(`/liste/${listeId}/gizlilik`);
        return response.data;
    },
};

// ============================================
// KULLANICI API
// ============================================

export const kullaniciApi = {
    // Profil getir (username ile)
    getProfil: async (username: string) => {
        const response = await api.get<Kullanici>(`/kullanici/username/${username}`);
        return response.data;
    },

    // Profil güncelle
    updateProfil: async (data: { goruntulemeAdi?: string; biyografi?: string; avatarUrl?: string }) => {
        const response = await api.put<Kullanici>('/kullanici/profil', data);
        return response.data;
    },

    // Takip et (GUID id ile)
    takipEt: async (kullaniciId: string) => {
        const response = await api.post(`/kullanici/${kullaniciId}/takip`);
        return response.data;
    },

    // Takibi bırak (aynı endpoint toggle yapar)
    takipBirak: async (kullaniciId: string) => {
        const response = await api.post(`/kullanici/${kullaniciId}/takip`);
        return response.data;
    },

    // Takip durumunu kontrol et
    takipDurumuKontrol: async (kullaniciId: string) => {
        try {
            const response = await api.get<{ takipEdiyor: boolean }>(`/kullanici/${kullaniciId}/takip-durumu`);
            return response.data.takipEdiyor;
        } catch {
            return false;
        }
    },

    // Önerilen kullanıcılar (akıllı öneri sistemi - benzer içerik türleriyle ilgilenenler)
    getOnerilenler: async (limit?: number) => {
        const response = await api.get<OnerilenKullanici[]>('/kullanici/onerilen', { params: { limit } });
        return response.data;
    },

    // Popüler kullanıcılar (en çok takipçili)
    getPopuler: async (limit?: number) => {
        const response = await api.get<Kullanici[]>('/kullanici/populer', { params: { limit } });
        return response.data;
    },

    // Kullanıcı ara
    ara: async (q: string, limit?: number) => {
        const response = await api.get<Kullanici[]>('/kullanici/ara', { params: { q, limit } });
        return response.data;
    },

    // Takipçileri getir (backend: /api/kullanici/{id}/takip-edenler)
    getTakipciler: async (kullaniciId: string) => {
        const response = await api.get<Kullanici[]>(`/kullanici/${kullaniciId}/takip-edenler`);
        return response.data;
    },

    // Takip edilenleri getir (backend: /api/kullanici/{id}/takip-ettikleri)
    getTakipEdilenler: async (kullaniciId: string) => {
        const response = await api.get<Kullanici[]>(`/kullanici/${kullaniciId}/takip-ettikleri`);
        return response.data;
    },
};

// ============================================
// EXTERNAL API (TMDB & Google Books)
// ============================================

export const externalApi = {
    // TMDB Film ara
    searchTmdb: async (q: string, sayfa?: number) => {
        const response = await api.get<TmdbFilm[]>('/externalapi/tmdb/search', { params: { q, sayfa } });
        return response.data;
    },

    // TMDB Dizi ara
    searchTmdbTv: async (q: string, sayfa?: number) => {
        const response = await api.get<TmdbFilm[]>('/externalapi/tmdb/search-tv', { params: { q, sayfa } });
        return response.data;
    },

    // TMDB Film + Dizi ara (multi)
    searchTmdbMulti: async (q: string, sayfa?: number) => {
        const response = await api.get<TmdbFilm[]>('/externalapi/tmdb/search-multi', { params: { q, sayfa } });
        return response.data;
    },

    // TMDB Popüler filmler
    getTmdbPopular: async (sayfa?: number) => {
        const response = await api.get<TmdbFilm[]>('/externalapi/tmdb/popular', { params: { sayfa } });
        return response.data;
    },

    // TMDB Popüler diziler
    getTmdbPopularTv: async (sayfa?: number) => {
        const response = await api.get<TmdbFilm[]>('/externalapi/tmdb/popular-tv', { params: { sayfa } });
        return response.data;
    },

    // TMDB En yüksek puanlı filmler
    getTmdbTopRated: async (sayfa?: number) => {
        const response = await api.get<TmdbFilm[]>('/externalapi/tmdb/top-rated', { params: { sayfa } });
        return response.data;
    },

    // TMDB En yüksek puanlı diziler
    getTmdbTopRatedTv: async (sayfa?: number) => {
        const response = await api.get<TmdbFilm[]>('/externalapi/tmdb/top-rated-tv', { params: { sayfa } });
        return response.data;
    },

    // TMDB Vizyondaki filmler
    getTmdbNowPlaying: async (sayfa?: number) => {
        const response = await api.get<TmdbFilm[]>('/externalapi/tmdb/now-playing', { params: { sayfa } });
        return response.data;
    },

    // TMDB Yayındaki diziler
    getTmdbOnTheAir: async (sayfa?: number) => {
        const response = await api.get<TmdbFilm[]>('/externalapi/tmdb/on-the-air', { params: { sayfa } });
        return response.data;
    },

    // TMDB Trending (Film + Dizi)
    getTmdbTrending: async (mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week', sayfa?: number) => {
        const response = await api.get<TmdbFilm[]>('/externalapi/tmdb/trending', { params: { mediaType, timeWindow, sayfa } });
        return response.data;
    },

    // TMDB Film detayı
    getTmdbFilm: async (id: string) => {
        const response = await api.get<TmdbFilm>(`/externalapi/tmdb/${id}`);
        return response.data;
    },

    // TMDB Dizi detayı
    getTmdbTvShow: async (id: string) => {
        const response = await api.get<TmdbFilm>(`/externalapi/tmdb/tv/${id}`);
        return response.data;
    },

    // TMDB Film import et
    importTmdbFilm: async (tmdbId: string) => {
        const response = await api.post<Icerik>(`/externalapi/tmdb/import/${tmdbId}`);
        return response.data;
    },

    // TMDB Dizi import et
    importTmdbTvShow: async (tmdbId: string) => {
        const response = await api.post<Icerik>(`/externalapi/tmdb/import-tv/${tmdbId}`);
        return response.data;
    },

    // Google Books ara
    searchBooks: async (q: string, baslangic?: number, limit?: number, orderBy?: 'relevance' | 'newest') => {
        const response = await api.get<GoogleBook[]>('/externalapi/books/search', {
            params: { q, baslangic, limit, orderBy },
        });
        return response.data;
    },

    // Google Books detayı
    getBook: async (id: string) => {
        const response = await api.get<GoogleBook>(`/externalapi/books/${id}`);
        return response.data;
    },

    // Google Books import et
    importBook: async (googleBooksId: string) => {
        const response = await api.post<Icerik>(`/externalapi/books/import/${googleBooksId}`);
        return response.data;
    },
};

// ============================================
// BILDIRIM API - Bildirim İşlemleri
// ============================================

export interface BildirimKullanici {
    id: string;
    kullaniciAdi: string;
    avatarUrl?: string;
}

export interface Bildirim {
    id: number;
    tip: string;
    baslik?: string;
    mesaj?: string;
    linkUrl?: string;
    okundu: boolean;
    olusturulmaZamani: string;
    gonderen?: BildirimKullanici;
}

export interface BildirimListResponse {
    bildirimler: Bildirim[];
    toplamSayisi: number;
    sayfa: number;
    toplamSayfa: number;
}

export interface OkunmamisBildirimlerResponse {
    bildirimler: Bildirim[];
    okunmamisSayisi: number;
}

export const bildirimApi = {
    // Bildirimleri getir (sayfalı)
    getBildirimler: async (params?: { sayfa?: number; limit?: number }) => {
        const response = await api.get<BildirimListResponse>('/bildirim', { params });
        return response.data;
    },

    // Okunmamış bildirimleri getir
    getOkunmamis: async () => {
        const response = await api.get<OkunmamisBildirimlerResponse>('/bildirim/okunmamis');
        return response.data;
    },

    // Okunmamış bildirim sayısını getir
    getOkunmamisSayisi: async () => {
        const response = await api.get<{ okunmamisSayisi: number }>('/bildirim/sayisi');
        return response.data.okunmamisSayisi;
    },

    // Bildirimi okundu işaretle
    okunduIsaretle: async (id: number) => {
        const response = await api.post<{ message: string }>(`/bildirim/${id}/okundu`);
        return response.data;
    },

    // Tüm bildirimleri okundu işaretle
    tumunuOkunduIsaretle: async () => {
        const response = await api.post<{ message: string }>('/bildirim/tumunu-okundu-isaretle');
        return response.data;
    },

    // Bildirimi sil
    sil: async (id: number) => {
        const response = await api.delete<{ message: string }>(`/bildirim/${id}`);
        return response.data;
    },

    // Tüm bildirimleri sil
    tumunuSil: async () => {
        const response = await api.delete<{ message: string }>('/bildirim/tumunu-sil');
        return response.data;
    },
};

// ============================================
// AUTH API - Kimlik Doğrulama İşlemleri
// ============================================

export const authApi = {
    // Şifremi unuttum - e-posta gönder
    forgotPassword: async (eposta: string) => {
        const response = await api.post<{ message: string }>('/auth/forgot-password', { eposta });
        return response.data;
    },

    // Şifre sıfırlama (token ile)
    resetPassword: async (data: { token: string; yeniSifre: string; yeniSifreTekrar: string }) => {
        const response = await api.post<{ message: string }>('/auth/reset-password', data);
        return response.data;
    },

    // Hesap silme
    deleteAccount: async () => {
        const response = await api.delete<{ message: string }>('/kullanici/hesap');
        return response.data;
    },
};

export default api;