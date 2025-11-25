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

// Detay Getir
export const useContentDetail = (id: string | undefined) => {
    return useQuery({
        queryKey: ['icerik', 'detay', id],
        queryFn: () => icerikService.getById(id!),
        enabled: !!id, // ID yoksa istek atma
    });
};

// Arama Yap
export const useSearchContent = (query: string) => {
    return useQuery({
        queryKey: ['icerik', 'arama', query],
        queryFn: () => icerikService.search(query),
        enabled: query.length > 2, // 2 harften azsa arama yapma
    });
};

export const useContentComments = (icerikId: number) => {
    return useQuery({
        queryKey: ['yorumlar', icerikId],
        queryFn: () => yorumService.getByIcerik(icerikId),
        enabled: !!icerikId,
    });
};