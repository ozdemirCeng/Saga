import { useMutation, useQueryClient } from '@tanstack/react-query';
import { puanlamaService } from '../services/puanlamaService';
// HATA BURADAYDI, AŞAĞIDAKİ GİBİ 'type' EKLEYEREK DÜZELTİYORUZ:
import { yorumService, type YorumCreateDto } from '../services/yorumService';
import toast from 'react-hot-toast';

export const useInteractions = () => {
    const queryClient = useQueryClient();

    // Puan Verme Hook'u
    const rateMutation = useMutation({
        mutationFn: ({ icerikId, puan }: { icerikId: number; puan: number }) =>
            puanlamaService.addPuan(icerikId, puan),

        onSuccess: (_, variables) => {
            toast.success('Puanınız kaydedildi!');
            // İlgili içeriğin detay verisini yenile (puan güncellensin diye)
            queryClient.invalidateQueries({ queryKey: ['icerik', 'detay', String(variables.icerikId)] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Puan verilirken hata oluştu.");
        }
    });

    // Yorum Yapma Hook'u
    const commentMutation = useMutation({
        mutationFn: (data: YorumCreateDto) => yorumService.addYorum(data),

        onSuccess: (_, variables) => {
            toast.success('Yorumunuz paylaşıldı!');
            // Yorum listesini yenile
            queryClient.invalidateQueries({ queryKey: ['yorumlar', variables.icerikId] });
            // İçerik detayını da yenile (yorum sayısı artsın)
            queryClient.invalidateQueries({ queryKey: ['icerik', 'detay', String(variables.icerikId)] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Yorum yapılırken hata oluştu.");
        }
    });

    return {
        rate: rateMutation,
        comment: commentMutation,
    };
};