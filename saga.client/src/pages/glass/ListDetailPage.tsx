import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  List,
  Globe,
  Lock,
  Loader2,
  MoreVertical,
  Trash2,
  Edit2,
  Share2,
  Film,
  BookOpen,
  Tv,
  Star,
  Calendar,
  User,
  X,
} from 'lucide-react';
import { Menu } from '@mantine/core';
import { useAuth } from '../../context/AuthContext';
import { listeApi } from '../../services/api';
import type { Liste } from '../../services/api';

// ============================================
// NEBULA UI COMPONENTS
// ============================================

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 rounded-2xl bg-[rgba(20,20,35,0.65)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-lg ${className}`}>
      {children}
    </div>
  );
}

function Button({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick 
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50';
  const variantStyles = {
    primary: 'bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white hover:shadow-lg hover:shadow-[#6C5CE7]/25',
    secondary: 'bg-[rgba(255,255,255,0.08)] text-white border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.12)]',
    ghost: 'bg-transparent text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]',
    danger: 'bg-[#d63031] text-white hover:bg-[#c0392b]',
  };
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1',
    md: 'px-4 py-2 text-sm gap-2',
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </button>
  );
}

function getIcerikIcon(tur: string) {
  switch (tur) {
    case 'film':
      return <Film size={16} className="text-[#6C5CE7]" />;
    case 'dizi':
      return <Tv size={16} className="text-[#00CEC9]" />;
    case 'kitap':
      return <BookOpen size={16} className="text-[#fdcb6e]" />;
    default:
      return <Film size={16} className="text-[#8E8E93]" />;
  }
}

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // DEBUG - route çalışıyor mu test et
  console.log('ListDetailPage RENDER - id:', id);
  
  const [liste, setListe] = useState<Liste | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<number | null>(null);

  const listeId = parseInt(id || '0');
  const isOwner = liste?.kullaniciId === user?.id;

  // Liste detayını yükle
  useEffect(() => {
    const loadListe = async () => {
      if (!listeId) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await listeApi.getById(listeId);
        setListe(data);
      } catch (err: unknown) {
        console.error('Liste yüklenirken hata:', err);
        const error = err as { response?: { status?: number } };
        if (error.response?.status === 404) {
          setError('Liste bulunamadı');
        } else if (error.response?.status === 403) {
          setError('Bu listeyi görüntüleme yetkiniz yok');
        } else {
          setError('Liste yüklenirken bir hata oluştu');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadListe();
  }, [listeId]);

  // İçerik çıkar
  const handleRemoveIcerik = async (icerikId: number) => {
    if (!liste || !isOwner) return;
    
    setRemoveLoading(icerikId);
    try {
      await listeApi.removeIcerik(liste.id, icerikId);
      setListe(prev => prev ? {
        ...prev,
        icerikler: prev.icerikler?.filter(i => i.icerikId !== icerikId),
        icerikSayisi: (prev.icerikSayisi || 1) - 1
      } : null);
    } catch (err) {
      console.error('İçerik çıkarılırken hata:', err);
    } finally {
      setRemoveLoading(null);
    }
  };

  // Gizlilik toggle
  const handleTogglePrivacy = async () => {
    if (!liste || !isOwner) return;
    
    try {
      const result = await listeApi.toggleGizlilik(liste.id);
      setListe(prev => prev ? { ...prev, herkeseAcik: result.herkeseAcik } : null);
    } catch (err) {
      console.error('Gizlilik değiştirilirken hata:', err);
    }
  };

  // Paylaş
  const handleShare = async () => {
    if (!liste) return;
    
    try {
      const result = await listeApi.paylas(liste.id);
      const shareUrl = `${window.location.origin}/liste/${result.listeId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Liste linki kopyalandı!');
    } catch (err) {
      console.error('Paylaşım hatası:', err);
    }
  };

  // Liste sil
  const handleDelete = async () => {
    if (!liste || !isOwner) return;
    if (!confirm('Bu listeyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await listeApi.delete(liste.id);
      navigate('/listelerim');
    } catch (err) {
      console.error('Liste silinirken hata:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-0">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-8 h-8 skeleton rounded-full" />
          <div className="h-6 w-32 skeleton rounded" />
        </div>
        <div className="skeleton h-32 rounded-2xl mb-6" />
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !liste) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-0">
        <GlassCard className="text-center py-12">
          <List size={48} className="mx-auto mb-4 text-[#fd79a8]" />
          <h2 className="text-xl font-semibold text-white mb-2">
            {error || 'Liste Bulunamadı'}
          </h2>
          <p className="text-[#8E8E93] mb-6">
            Aradığınız liste mevcut değil veya erişim izniniz yok.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Geri Dön
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-0 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-2 text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
      >
        <div className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] group-hover:bg-[rgba(108,92,231,0.2)] transition-colors">
          <ArrowLeft size={16} />
        </div>
        <span className="text-sm">Geri</span>
      </button>

      {/* Header Card - Enhanced */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Background blur from posters */}
        {liste.icerikler && liste.icerikler[0]?.posterUrl && (
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${liste.icerikler[0].posterUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px)',
            }}
          />
        )}
        
        <div className="relative bg-[rgba(20,20,35,0.85)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] p-5 lg:p-6">
          <div className="flex items-start gap-5">
            {/* Poster Grid - Enhanced */}
            <div className="w-28 h-36 lg:w-36 lg:h-48 rounded-xl overflow-hidden bg-gradient-to-br from-[rgba(108,92,231,0.2)] to-[rgba(0,206,201,0.1)] flex-shrink-0 shadow-xl shadow-black/20">
              <div className="w-full h-full grid grid-cols-2 gap-[2px]">
                {liste.icerikler && liste.icerikler.slice(0, 4).map((icerik, i) => (
                  <div key={i} className="relative overflow-hidden bg-[rgba(0,0,0,0.3)]">
                    {icerik.posterUrl ? (
                      <img 
                        src={icerik.posterUrl} 
                        alt="" 
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[rgba(255,255,255,0.05)]">
                        {getIcerikIcon(icerik.tur)}
                      </div>
                    )}
                  </div>
                ))}
                {(!liste.icerikler || liste.icerikler.length < 4) && 
                  Array(4 - (liste.icerikler?.length || 0)).fill(0).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-[rgba(255,255,255,0.03)]" />
                  ))
                }
              </div>
            </div>

            {/* Info - Enhanced */}
            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-white truncate">{liste.ad}</h1>
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                  liste.herkeseAcik 
                    ? 'bg-[#00CEC9]/20 text-[#00CEC9] border border-[#00CEC9]/30' 
                    : 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] border border-[rgba(255,255,255,0.1)]'
                }`}>
                  {liste.herkeseAcik ? <Globe size={12} /> : <Lock size={12} />}
                  {liste.herkeseAcik ? 'Herkese Açık' : 'Gizli'}
                </div>
              </div>
              
              {liste.aciklama && (
                <p className="text-sm text-[rgba(255,255,255,0.6)] mb-4 line-clamp-2 leading-relaxed">
                  {liste.aciklama}
                </p>
              )}

              {/* Stats Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 rounded-full bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 flex items-center gap-2 text-sm">
                  <Film size={14} className="text-[#6C5CE7]" />
                  <span className="text-white font-medium">{liste.icerikSayisi || 0}</span>
                  <span className="text-[rgba(255,255,255,0.5)]">içerik</span>
                </div>
                <button 
                  onClick={() => navigate(`/profil/${liste.kullaniciAdi}`)}
                  className="px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center gap-2 text-sm hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  <User size={14} className="text-[#a29bfe]" />
                  <span className="text-[rgba(255,255,255,0.7)]">@{liste.kullaniciAdi}</span>
                </button>
                <div className="px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-[rgba(255,255,255,0.4)]" />
                  <span className="text-[rgba(255,255,255,0.5)]">{new Date(liste.olusturulmaZamani).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            </div>

            {/* Menu Button (Owner Only) - Enhanced */}
            {isOwner && (
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <button className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] transition-colors">
                    <MoreVertical size={18} className="text-[rgba(255,255,255,0.6)]" />
                  </button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<Edit2 size={14} />}
                    onClick={() => navigate(`/liste/${liste.id}/duzenle`)}
                  >
                    Düzenle
                  </Menu.Item>
                  <Menu.Item
                    leftSection={liste.herkeseAcik ? <Lock size={14} /> : <Globe size={14} />}
                    onClick={handleTogglePrivacy}
                  >
                    {liste.herkeseAcik ? 'Gizli Yap' : 'Herkese Aç'}
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<Share2 size={14} />}
                    onClick={handleShare}
                  >
                    Paylaş
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<Trash2 size={14} />}
                    onClick={handleDelete}
                  >
                    Sil
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </div>
        </div>
      </div>

      {/* Content List - Enhanced */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#6C5CE7]/15">
              <List size={18} className="text-[#6C5CE7]" />
            </div>
            Liste İçerikleri
          </h2>
          {liste.icerikler && liste.icerikler.length > 0 && (
            <span className="text-sm text-[rgba(255,255,255,0.4)]">
              {liste.icerikler.length} içerik
            </span>
          )}
        </div>

        {liste.icerikler && liste.icerikler.length > 0 ? (
          <div className="space-y-2">
            {liste.icerikler.map((icerik, index) => (
              <div 
                key={icerik.icerikId} 
                className="group relative rounded-xl bg-[rgba(20,20,35,0.65)] backdrop-blur-xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(108,92,231,0.3)] transition-all duration-300 overflow-hidden"
              >
                {/* Subtle gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-[rgba(108,92,231,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative flex items-center gap-4 p-3">
                  {/* Index Badge */}
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[rgba(108,92,231,0.2)] to-[rgba(108,92,231,0.05)] border border-[rgba(108,92,231,0.2)] flex items-center justify-center text-sm font-bold text-[#a29bfe]">
                    {index + 1}
                  </div>

                  {/* Poster - Enhanced */}
                  <button
                    onClick={() => navigate(`/icerik/${icerik.tur}/${icerik.icerikId}`)}
                    className="w-14 h-20 rounded-lg overflow-hidden bg-[rgba(255,255,255,0.05)] flex-shrink-0 shadow-lg shadow-black/20 ring-1 ring-[rgba(255,255,255,0.1)] group-hover:ring-[rgba(108,92,231,0.3)] transition-all"
                  >
                    {icerik.posterUrl ? (
                      <img 
                        src={icerik.posterUrl} 
                        alt={icerik.baslik} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[rgba(108,92,231,0.1)] to-transparent">
                        {getIcerikIcon(icerik.tur)}
                      </div>
                    )}
                  </button>

                  {/* Info - Enhanced */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => navigate(`/icerik/${icerik.tur}/${icerik.icerikId}`)}
                      className="text-left w-full"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1 rounded ${
                          icerik.tur === 'film' ? 'bg-[#6C5CE7]/15' :
                          icerik.tur === 'dizi' ? 'bg-[#00CEC9]/15' :
                          'bg-[#fdcb6e]/15'
                        }`}>
                          {getIcerikIcon(icerik.tur)}
                        </div>
                        <h3 className="font-semibold text-white truncate group-hover:text-[#a29bfe] transition-colors">
                          {icerik.baslik}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        {icerik.ortalamaPuan > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <Star size={12} className="text-[#f39c12] fill-[#f39c12]" />
                            <span className="text-white font-medium">{icerik.ortalamaPuan.toFixed(1)}</span>
                          </div>
                        )}
                        <span className="text-xs text-[rgba(255,255,255,0.4)] capitalize">{icerik.tur}</span>
                      </div>
                      {icerik.notMetni && (
                        <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1.5 line-clamp-1 italic bg-[rgba(255,255,255,0.03)] px-2 py-1 rounded">
                          "{icerik.notMetni}"
                        </p>
                      )}
                    </button>
                  </div>

                  {/* Remove Button (Owner Only) - Enhanced */}
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveIcerik(icerik.icerikId)}
                      disabled={removeLoading === icerik.icerikId}
                      className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] hover:bg-[#fd79a8]/15 text-[rgba(255,255,255,0.3)] hover:text-[#fd79a8] border border-transparent hover:border-[#fd79a8]/30 transition-all opacity-0 group-hover:opacity-100"
                    >
                      {removeLoading === icerik.icerikId ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <X size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[rgba(20,20,35,0.65)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center mx-auto mb-4">
              <List size={32} className="text-[rgba(255,255,255,0.2)]" />
            </div>
            <p className="text-[rgba(255,255,255,0.5)] font-medium">Bu liste henüz boş</p>
            {isOwner && (
              <p className="text-sm text-[rgba(255,255,255,0.3)] mt-2">
                İçerik detay sayfalarından bu listeye içerik ekleyebilirsiniz.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
