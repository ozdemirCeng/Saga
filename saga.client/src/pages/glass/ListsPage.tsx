import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  Plus,
  Globe,
  Lock,
  Loader2,
  MoreVertical,
  Trash2,
  Edit2,
  Share2,
  Film,
  BookOpen,
} from 'lucide-react';
import { Menu } from '@mantine/core';
import { useAuth } from '../../context/AuthContext';
import { listeApi } from '../../services/api';
import type { Liste } from '../../services/api';
import { CreateModal } from '../../components/modals/CreateModal';

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

export default function ListsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [listeler, setListeler] = useState<Liste[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // Listeleri yükle
  useEffect(() => {
    const loadListeler = async () => {
      if (!isAuthenticated || !user) return;
      
      setLoading(true);
      try {
        const data = await listeApi.getMyListeler();
        setListeler(data);
      } catch (err) {
        console.error('Listeler yüklenirken hata:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadListeler();
  }, [isAuthenticated, user]);

  // Liste sil
  const handleDelete = async (listeId: number) => {
    if (!confirm('Bu listeyi silmek istediğinizden emin misiniz?')) return;
    
    setDeleteLoading(listeId);
    try {
      await listeApi.delete(listeId);
      setListeler(prev => prev.filter(l => l.id !== listeId));
    } catch (err) {
      console.error('Liste silinirken hata:', err);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Gizlilik toggle
  const handleTogglePrivacy = async (liste: Liste) => {
    try {
      const result = await listeApi.toggleGizlilik(liste.id);
      setListeler(prev => prev.map(l => 
        l.id === liste.id ? { ...l, herkeseAcik: result.herkeseAcik } : l
      ));
    } catch (err) {
      console.error('Gizlilik değiştirilirken hata:', err);
    }
  };

  // Paylaş
  const handleShare = async (liste: Liste) => {
    try {
      const result = await listeApi.paylas(liste.id);
      const shareUrl = `${window.location.origin}/liste/${result.listeId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Liste linki kopyalandı!');
    } catch (err) {
      console.error('Paylaşım hatası:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="text-center py-12">
          <List size={48} className="mx-auto mb-4 text-[#8E8E93]" />
          <h2 className="text-xl font-semibold text-white mb-2">Giriş Yapmalısınız</h2>
          <p className="text-[#8E8E93] mb-6">Listelerinizi görüntülemek için giriş yapın.</p>
          <Button onClick={() => navigate('/giris')}>Giriş Yap</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Listelerim</h1>
          <p className="text-[rgba(255,255,255,0.5)] text-sm mt-1">
            {listeler.length} liste
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          Yeni Liste
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[#6C5CE7]" />
        </div>
      ) : listeler.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listeler.map((liste) => (
            <GlassCard
              key={liste.id}
              className="p-4 hover:border-[rgba(255,255,255,0.15)] transition-colors relative"
            >
              <div className="flex items-start gap-4">
                {/* Cover Images */}
                <div className="w-20 h-24 rounded-lg overflow-hidden bg-[rgba(255,255,255,0.05)] flex-shrink-0 grid grid-cols-2 gap-0.5">
                  {liste.icerikler && liste.icerikler.slice(0, 4).map((icerik, i) => (
                    <div key={i} className="bg-[rgba(255,255,255,0.1)]">
                      {icerik.posterUrl ? (
                        <img src={icerik.posterUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {icerik.tur === 'kitap' ? <BookOpen size={10} /> : <Film size={10} />}
                        </div>
                      )}
                    </div>
                  ))}
                  {(!liste.icerikler || liste.icerikler.length < 4) && 
                    Array(4 - (liste.icerikler?.length || 0)).fill(0).map((_, i) => (
                      <div key={`empty-${i}`} className="bg-[rgba(255,255,255,0.05)]" />
                    ))
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate(`/liste/${liste.id}`)}
                    className="text-left w-full"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{liste.ad}</h3>
                      {liste.herkeseAcik ? (
                        <Globe size={14} className="text-[#00CEC9] flex-shrink-0" />
                      ) : (
                        <Lock size={14} className="text-[rgba(255,255,255,0.4)] flex-shrink-0" />
                      )}
                    </div>
                    {liste.aciklama && (
                      <p className="text-sm text-[rgba(255,255,255,0.5)] line-clamp-2 mb-2">
                        {liste.aciklama}
                      </p>
                    )}
                    <p className="text-xs text-[rgba(255,255,255,0.4)]">
                      {liste.icerikSayisi || 0} içerik
                    </p>
                  </button>
                </div>

                {/* Menu Button */}
                <Menu shadow="md" width={200} position="bottom-end">
                  <Menu.Target>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                    >
                      <MoreVertical size={18} className="text-[rgba(255,255,255,0.5)]" />
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
                      onClick={() => handleTogglePrivacy(liste)}
                    >
                      {liste.herkeseAcik ? 'Gizli Yap' : 'Herkese Aç'}
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<Share2 size={14} />}
                      onClick={() => handleShare(liste)}
                    >
                      Paylaş
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={deleteLoading === liste.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      onClick={() => handleDelete(liste.id)}
                      disabled={deleteLoading === liste.id}
                    >
                      Sil
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <List size={48} className="mx-auto mb-4 text-[#8E8E93]" />
          <h2 className="text-xl font-semibold text-white mb-2">Henüz Liste Yok</h2>
          <p className="text-[#8E8E93] mb-6">
            Film, dizi veya kitaplarınızı organize etmek için listeler oluşturun.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            İlk Listeni Oluştur
          </Button>
        </GlassCard>
      )}

      {/* Create Modal */}
      <CreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
