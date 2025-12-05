import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Globe,
  Lock,
  Loader2,
  MoreHorizontal,
  Trash2,
  Edit3,
  Share2,
  Film,
  BookOpen,
  Tv,
  Sparkles,
  FolderPlus,
} from 'lucide-react';
import { Menu } from '@mantine/core';
import { useAuth } from '../../context/AuthContext';
import { listeApi } from '../../services/api';
import type { Liste } from '../../services/api';
import { CreateModal } from '../../components/modals/CreateModal';

function getIcerikIcon(tur: string) {
  switch (tur) {
    case 'film': return <Film size={20} className="text-[#a29bfe]" />;
    case 'dizi': return <Tv size={20} className="text-[#00CEC9]" />;
    case 'kitap': return <BookOpen size={20} className="text-[#fdcb6e]" />;
    default: return <Film size={20} className="text-[#8E8E93]" />;
  }
}

export default function ListsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [listeler, setListeler] = useState<Liste[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  
  // Sonsuz döngüyü engellemek için ref kullanıyoruz
  const hasFetched = useRef(false);

  useEffect(() => {
    // Eğer giriş yapılmamışsa veya zaten fetch edildiyse çık
    if (!isAuthenticated || hasFetched.current) {
      if (!isAuthenticated) setLoading(false);
      return;
    }
    
    hasFetched.current = true;
    
    const loadListeler = async () => {
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
  }, [isAuthenticated]);

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

  // Giriş yapılmamışsa
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="rounded-2xl bg-[rgba(20,20,35,0.65)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#6C5CE7]/20 to-[#00CEC9]/10 flex items-center justify-center">
            <FolderPlus size={28} className="text-[#6C5CE7]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Giriş Yapın</h2>
          <p className="text-[rgba(255,255,255,0.5)] mb-6 text-sm">
            Listelerinizi görüntülemek için giriş yapın.
          </p>
          <button 
            onClick={() => navigate('/giris')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Listelerim</h1>
          <p className="text-[rgba(255,255,255,0.5)] text-sm mt-0.5">
            {listeler.length} liste oluşturdunuz
          </p>
        </div>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
          <span>Yeni Liste</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#6C5CE7]" />
        </div>
      ) : listeler.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listeler.map((liste) => {
            // Backend'den posterler veya icerikler gelebilir
            const posters: Array<{posterUrl?: string; tur?: string}> = (liste as any).posterler || liste.icerikler?.slice(0, 4) || [];
            
            return (
              <div
                key={liste.id}
                className="group rounded-2xl bg-[rgba(20,20,35,0.65)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] overflow-hidden hover:border-[rgba(108,92,231,0.3)] transition-colors"
              >
                {/* Poster Grid */}
                <button
                  onClick={() => navigate(`/liste/${liste.id}`)}
                  className="w-full aspect-video relative bg-gradient-to-br from-[rgba(108,92,231,0.1)] to-[rgba(0,206,201,0.05)]"
                >
                  {posters.length > 0 && posters.some(p => p.posterUrl) ? (
                    <div className={`absolute inset-0 grid ${
                      posters.length === 1 ? 'grid-cols-1' : 
                      posters.length === 2 ? 'grid-cols-2' : 
                      'grid-cols-2 grid-rows-2'
                    }`}>
                      {posters.map((icerik, i) => (
                        <div key={i} className="overflow-hidden">
                          {icerik.posterUrl ? (
                            <img 
                              src={icerik.posterUrl} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[rgba(255,255,255,0.03)]">
                              {getIcerikIcon(icerik.tur || 'film')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <FolderPlus size={32} className="text-[rgba(255,255,255,0.15)]" />
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,20,35,0.8)] via-transparent to-transparent" />
                  
                  {/* Privacy badge - sağ üst */}
                  <div className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    liste.herkeseAcik 
                      ? 'bg-[#00CEC9]/20 text-[#00CEC9]' 
                      : 'bg-[rgba(0,0,0,0.4)] text-[rgba(255,255,255,0.7)]'
                  }`}>
                    {liste.herkeseAcik ? <Globe size={10} /> : <Lock size={10} />}
                    {liste.herkeseAcik ? 'Açık' : 'Gizli'}
                  </div>
                </button>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => navigate(`/liste/${liste.id}`)}
                      className="flex-1 text-left min-w-0"
                    >
                      <h3 className="font-medium text-white text-sm truncate group-hover:text-[#a29bfe] transition-colors">
                        {liste.ad}
                      </h3>
                      <p className="text-xs text-[rgba(255,255,255,0.4)] mt-0.5 truncate">
                        {liste.aciklama || 'Açıklama eklenmemiş'}
                      </p>
                    </button>
                    
                    <Menu shadow="md" width={160} position="bottom-end">
                      <Menu.Target>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md hover:bg-[rgba(255,255,255,0.08)]"
                        >
                          <MoreHorizontal size={16} className="text-[rgba(255,255,255,0.5)]" />
                        </button>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<Edit3 size={14} />}
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
                  
                  {/* Alt kısım: tarih ve içerik sayısı */}
                  <div className="flex items-center justify-between mt-2 text-[rgba(255,255,255,0.4)]">
                    <span className="text-[10px]">
                      {new Date(liste.olusturulmaZamani).toLocaleDateString('tr-TR')}
                    </span>
                    <span className="text-xs flex items-center gap-1">
                      <Film size={11} />
                      {liste.icerikSayisi || 0} içerik
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-[rgba(20,20,35,0.65)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#6C5CE7]/15 to-[#00CEC9]/10 flex items-center justify-center">
            <Sparkles size={28} className="text-[#6C5CE7]" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">İlk Listeni Oluştur</h2>
          <p className="text-[rgba(255,255,255,0.5)] mb-6 text-sm">
            Film, dizi veya kitaplarını organize et.
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Liste Oluştur
          </button>
        </div>
      )}

      <CreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
