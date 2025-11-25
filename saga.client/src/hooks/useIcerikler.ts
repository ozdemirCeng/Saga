import { useQuery } from '@tanstack/react-query';
import { icerikService } from '../services/icerikService';
import { yorumService } from '../services/yorumService';

// Popüler İçerikleri Getir
export const usePopularContent = () => {
    return useQuery({
        queryKey: ['icerik', 'populer'], // Cache anahtarı
        queryFn: icerikService.getPopular,
    });
};

// En Yüksek Puanlılar
export const useTopRatedContent = (tur?: 'film' | 'kitap') => {
    return useQuery({
        queryKey: ['icerik', 'top-rated', tur],
        queryFn: () => icerikService.getTopRated({ tur }),
    });
};

// Yeni İçerikler
export const useRecentContent = (tur?: 'film' | 'kitap') => {
    return useQuery({
        queryKey: ['icerik', 'recent', tur],
        queryFn: () => icerikService.getRecent({ tur }),
    });
};

// Önerilen İçerikler
export const useRecommendedContent = () => {
    return useQuery({
        queryKey: ['icerik', 'recommended'],
        queryFn: () => icerikService.getRecommended(),
    });
};

// Detay Getir
export const useContentDetail = (id: number | null) => {
    return useQuery({
        queryKey: ['icerik', 'detay', id],
        queryFn: () => icerikService.getById(id!),
        enabled: typeof id === 'number' && id > 0,
    });
};

// Arama Yap
export const useSearchContent = (query: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['icerik', 'arama', query],
        queryFn: () => icerikService.search(query),
        enabled: options?.enabled !== undefined ? options.enabled : query.length > 2,
    });
};

// Filtreli Arama
export const useFilteredContent = (filters: {
    tur?: 'film' | 'kitap';
    turler?: string[];
    minPuan?: number;
    maxPuan?: number;
    yil?: number;
    minYil?: number;
    maxYil?: number;
    page?: number;
    limit?: number;
}, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['icerik', 'filter', filters],
        queryFn: () => icerikService.filter(filters),
        enabled: options?.enabled !== undefined ? options.enabled : true,
    });
};

export const useContentComments = (icerikId: number | null) => {
    return useQuery({
        queryKey: ['yorumlar', icerikId],
        queryFn: () => yorumService.getByIcerik(icerikId!),
        enabled: typeof icerikId === 'number' && icerikId > 0,
    });
};