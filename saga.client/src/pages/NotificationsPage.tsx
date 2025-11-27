import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, User, Heart, MessageCircle, UserPlus, List, Star, Loader2 } from 'lucide-react';
import { bildirimApi, type Bildirim } from '../services/api';

// Sidebar'daki bildirim sayısını yenilemek için global refresh fonksiyonu
export let refreshSidebarBildirim: (() => void) | null = null;
export const setRefreshSidebarBildirim = (fn: () => void) => { refreshSidebarBildirim = fn; };

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
    const [loading, setLoading] = useState(true);
    const [sayfa, setSayfa] = useState(1);
    const [toplamSayfa, setToplamSayfa] = useState(1);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchBildirimler = useCallback(async () => {
        try {
            setLoading(true);
            if (filter === 'unread') {
                const response = await bildirimApi.getOkunmamis();
                setBildirimler(response.bildirimler);
                setToplamSayfa(1);
            } else {
                const response = await bildirimApi.getBildirimler({ sayfa, limit: 20 });
                setBildirimler(response.bildirimler);
                setToplamSayfa(response.toplamSayfa);
            }
        } catch (err) {
            console.error('Bildirimler yüklenemedi:', err);
        } finally {
            setLoading(false);
        }
    }, [sayfa, filter]);

    useEffect(() => {
        fetchBildirimler();
    }, [fetchBildirimler]);

    const handleOkunduIsaretle = async (id: number) => {
        try {
            await bildirimApi.okunduIsaretle(id);
            setBildirimler(prev => prev.map(b => b.id === id ? { ...b, okundu: true } : b));
            refreshSidebarBildirim?.();
        } catch (err) {
            console.error('Okundu işaretlenemedi:', err);
        }
    };

    const handleTumunuOkunduIsaretle = async () => {
        try {
            await bildirimApi.tumunuOkunduIsaretle();
            setBildirimler(prev => prev.map(b => ({ ...b, okundu: true })));
            refreshSidebarBildirim?.();
        } catch (err) {
            console.error('Tümü okundu işaretlenemedi:', err);
        }
    };

    const handleSil = async (id: number) => {
        try {
            await bildirimApi.sil(id);
            setBildirimler(prev => prev.filter(b => b.id !== id));
            refreshSidebarBildirim?.();
        } catch (err) {
            console.error('Bildirim silinemedi:', err);
        }
    };

    const handleTumunuSil = async () => {
        if (!confirm('Tüm bildirimler silinecek. Emin misiniz?')) return;
        try {
            await bildirimApi.tumunuSil();
            setBildirimler([]);
            refreshSidebarBildirim?.();
        } catch (err) {
            console.error('Bildirimler silinemedi:', err);
        }
    };

    const handleBildirimClick = (bildirim: Bildirim) => {
        // Okundu işaretle
        if (!bildirim.okundu) {
            handleOkunduIsaretle(bildirim.id);
        }
        // Link varsa yönlendir
        if (bildirim.linkUrl) {
            navigate(bildirim.linkUrl);
        }
    };

    const getBildirimIcon = (tip: string) => {
        switch (tip) {
            case 'takip':
            case 'yeni_takipci':
                return <UserPlus className="w-5 h-5 text-blue-400" />;
            case 'begeni':
                return <Heart className="w-5 h-5 text-red-400" />;
            case 'yorum':
                return <MessageCircle className="w-5 h-5 text-green-400" />;
            case 'liste':
            case 'listeye_ekleme':
                return <List className="w-5 h-5 text-purple-400" />;
            case 'puanlama':
                return <Star className="w-5 h-5 text-yellow-400" />;
            default:
                return <Bell className="w-5 h-5 text-gray-400" />;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Az önce';
        if (minutes < 60) return `${minutes} dk önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 7) return `${days} gün önce`;
        return date.toLocaleDateString('tr-TR');
    };

    const okunmamisSayisi = bildirimler.filter(b => !b.okundu).length;

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="glass-card p-6 rounded-xl mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Bell className="w-6 h-6 text-blue-400" />
                            <h1 className="text-2xl font-bold text-white">Bildirimler</h1>
                            {okunmamisSayisi > 0 && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                                    {okunmamisSayisi} yeni
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleTumunuOkunduIsaretle}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                                title="Tümünü okundu işaretle"
                            >
                                <CheckCheck className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleTumunuSil}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                title="Tümünü sil"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setFilter('all'); setSayfa(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === 'all'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => { setFilter('unread'); setSayfa(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === 'unread'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Okunmamış
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    </div>
                ) : bildirimler.length === 0 ? (
                    <div className="glass-card p-12 rounded-xl text-center">
                        <Bell className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Bildirim Yok
                        </h3>
                        <p className="text-gray-400">
                            {filter === 'unread'
                                ? 'Okunmamış bildiriminiz bulunmuyor.'
                                : 'Henüz bildiriminiz bulunmuyor.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {bildirimler.map((bildirim) => (
                            <div
                                key={bildirim.id}
                                className={`glass-card p-4 rounded-xl cursor-pointer transition-all hover:bg-white/5 ${
                                    !bildirim.okundu ? 'border-l-4 border-blue-500' : ''
                                }`}
                                onClick={() => handleBildirimClick(bildirim)}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Avatar or Icon */}
                                    <div className="flex-shrink-0">
                                        {bildirim.gonderen?.avatarUrl ? (
                                            <img
                                                src={bildirim.gonderen.avatarUrl}
                                                alt={bildirim.gonderen.kullaniciAdi}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : bildirim.gonderen ? (
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                <User className="w-5 h-5 text-gray-400" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                {getBildirimIcon(bildirim.tip)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                {bildirim.baslik && (
                                                    <p className={`font-medium ${bildirim.okundu ? 'text-gray-300' : 'text-white'}`}>
                                                        {bildirim.baslik}
                                                    </p>
                                                )}
                                                {bildirim.mesaj && (
                                                    <p className="text-gray-400 text-sm mt-0.5 line-clamp-2">
                                                        {bildirim.mesaj}
                                                    </p>
                                                )}
                                                {bildirim.gonderen && (
                                                    <p className="text-gray-500 text-xs mt-1">
                                                        @{bildirim.gonderen.kullaniciAdi}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {getBildirimIcon(bildirim.tip)}
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-xs mt-2">
                                            {formatDate(bildirim.olusturulmaZamani)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {!bildirim.okundu && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOkunduIsaretle(bildirim.id);
                                                }}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-green-400"
                                                title="Okundu işaretle"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSil(bildirim.id);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && toplamSayfa > 1 && filter === 'all' && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => setSayfa(s => Math.max(1, s - 1))}
                            disabled={sayfa === 1}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white hover:bg-white/5"
                        >
                            Önceki
                        </button>
                        <span className="text-gray-400 text-sm">
                            {sayfa} / {toplamSayfa}
                        </span>
                        <button
                            onClick={() => setSayfa(s => Math.min(toplamSayfa, s + 1))}
                            disabled={sayfa === toplamSayfa}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white hover:bg-white/5"
                        >
                            Sonraki
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
