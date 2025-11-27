import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Edit3,
  Film,
  BookOpen,
  Star,
  MessageCircle,
  Plus,
  Users,
  Calendar,
  Check,
  Loader2,
  BookMarked,
  Eye,
  Play,
  AlertTriangle,
  Trash2,
  List,
  Camera,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { kullaniciApi, aktiviteApi, kutuphaneApi, listeApi } from '../../services/api';
import { supabase } from '../../services/supabase';
import type { Kullanici, Aktivite, KutuphaneDurumu, Liste } from '../../services/api';
import { ActivityCard } from '../../components/ActivityCard';

// ============================================
// NEBULA UI COMPONENTS
// ============================================

function GlassCard({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`p-5 rounded-2xl bg-[rgba(20,20,35,0.65)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-lg ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  );
}

function GlassPanel({ children, className = '', padding = 'md' }: { children: React.ReactNode; className?: string; padding?: 'sm' | 'md' | 'lg' }) {
  const paddings = { sm: 'p-3', md: 'p-5', lg: 'p-6' };
  return (
    <div className={`rounded-2xl bg-[rgba(30,30,50,0.5)] backdrop-blur-xl border border-[rgba(255,255,255,0.06)] ${paddings[padding]} ${className}`}>
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
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyles = {
    primary: 'bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white hover:shadow-lg hover:shadow-[#6C5CE7]/25',
    secondary: 'bg-[rgba(255,255,255,0.08)] text-white border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.12)]',
    ghost: 'bg-transparent text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]',
    success: 'bg-[#00b894] text-white hover:bg-[#00b894]/80',
    danger: 'bg-[#fd79a8] text-white hover:bg-[#fd79a8]/80'
  };
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    icon: 'w-10 h-10 p-0'
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </button>
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="text-center p-4">
      <div className="flex justify-center mb-2 text-[#6C5CE7]">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-[#8E8E93]">{label}</p>
    </div>
  );
}

// ============================================
// LIBRARY ITEM CARD COMPONENT
// ============================================

interface LibraryItemProps {
  item: KutuphaneDurumu;
}

function LibraryItemCard({ item }: LibraryItemProps) {
  const navigate = useNavigate();
  
  // Backend'den gelen alan adlarını destekle
  const icerikTur = item.tur || item.icerikTur || 'film';
  const icerikAdi = item.baslik || item.icerikAdi || '';
  const durum = item.durum || item.durumStr || '';

  const getDurumIcon = () => {
    switch (durum) {
      case 'izleniyor':
      case 'okunuyor':
      case 'devam_ediyor':
        return <Play size={12} className="text-[#6C5CE7]" />;
      case 'izlendi':
      case 'okundu':
        return <Check size={12} className="text-[#00b894]" />;
      case 'izlenecek':
      case 'okunacak':
        return <Eye size={12} className="text-[#f39c12]" />;
      case 'birakti':
        return <AlertTriangle size={12} className="text-[#fd79a8]" />;
      default:
        return <BookMarked size={12} className="text-[#8E8E93]" />;
    }
  };

  return (
    <div
      className="aspect-[2/3] rounded-xl overflow-hidden cursor-pointer relative group"
      onClick={() => navigate(`/icerik/${icerikTur}/${item.icerikId}`)}
    >
      {item.posterUrl ? (
        <img
          src={item.posterUrl}
          alt={icerikAdi}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-white/5 flex items-center justify-center">
          {icerikTur === 'kitap' ? (
            <BookOpen size={24} className="text-[#8E8E93]" />
          ) : (
            <Film size={24} className="text-[#8E8E93]" />
          )}
        </div>
      )}
      {/* Status badge */}
      <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm">
        {getDurumIcon()}
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-xs font-medium line-clamp-2">{icerikAdi}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PROFILE PAGE
// ============================================

// Proje isteri 2.1.5: Kütüphane Sekmeleri
type Tab = 'aktivite' | 'izlediklerim' | 'izlenecekler' | 'okuduklarim' | 'okunacaklar' | 'ozel-listeler';

export default function ProfilePage() {
  const { username: kullaniciAdi } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, requireAuth } = useAuth();

  // States
  const [profil, setProfil] = useState<Kullanici | null>(null);
  const [aktiviteler, setAktiviteler] = useState<Aktivite[]>([]);
  const [kutuphane, setKutuphane] = useState<KutuphaneDurumu[]>([]);
  const [listeler, setListeler] = useState<Liste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('aktivite');
  const [followLoading, setFollowLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showListeModal, setShowListeModal] = useState(false);
  const [listeForm, setListeForm] = useState({ ad: '', aciklama: '', herkeseAcik: true });
  const [listeLoading, setListeLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    goruntulemeAdi: '',
    biyografi: '',
    avatarUrl: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  
  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const isOwnProfile = user?.kullaniciAdi === kullaniciAdi;
  const isLoggedIn = !!user;

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!kullaniciAdi) return;

      setLoading(true);
      setError(null);

      try {
        // Önce profili al
        const profilData = await kullaniciApi.getProfil(kullaniciAdi);
        setProfil(profilData);
        
        // Edit form'u doldur
        setEditForm({
          goruntulemeAdi: profilData.goruntulemeAdi || '',
          biyografi: profilData.biyografi || '',
          avatarUrl: profilData.avatarUrl || ''
        });

        // Profil id'si ile aktivite ve kütüphane verilerini al
        const [aktiviteData, kutuphaneData, listeData] = await Promise.all([
          aktiviteApi.getKullaniciAktiviteleri(profilData.id, { sayfaBoyutu: 20 }),
          kutuphaneApi.getKullanicininKutuphanesi(profilData.id, { sayfaBoyutu: 50 }),
          listeApi.getKullaniciListeleri(profilData.id).catch(() => []),
        ]);

        setAktiviteler(aktiviteData.data);
        setKutuphane(kutuphaneData.data);
        setListeler(listeData);
      } catch (err: any) {
        console.error('Profil yükleme hatası:', err);
        setError(err.response?.data?.message || 'Profil yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [kullaniciAdi]);

  // Avatar yükleme
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Dosya boyutu kontrolü (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Dosya boyutu 2MB\'dan küçük olmalıdır.');
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      alert('Sadece resim dosyaları yüklenebilir.');
      return;
    }

    setAvatarUploading(true);
    try {
      // Önizleme oluştur
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Supabase Storage'a yükle
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      // Bucket adı 'avatars', dosya doğrudan root'a yüklenir
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Public URL al
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;
      setEditForm(prev => ({ ...prev, avatarUrl }));

    } catch (err) {
      console.error('Avatar yükleme hatası:', err);
      alert('Avatar yüklenirken bir hata oluştu.');
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Profil güncelleme
  const handleUpdateProfile = async () => {
    setEditLoading(true);
    try {
      const updateData: { goruntulemeAdi?: string; biyografi?: string; avatarUrl?: string } = {
        goruntulemeAdi: editForm.goruntulemeAdi || undefined,
        biyografi: editForm.biyografi || undefined,
      };
      // Sadece geçerli URL varsa gönder (boş string URL validation hatası verir)
      if (editForm.avatarUrl && editForm.avatarUrl.trim()) {
        updateData.avatarUrl = editForm.avatarUrl;
      }
      const updatedProfil = await kullaniciApi.updateProfil(updateData);
      setProfil(prev => prev ? { ...prev, ...updatedProfil } : null);
      setShowEditModal(false);
      setAvatarPreview(null);
    } catch (err) {
      console.error('Profil güncelleme hatası:', err);
    } finally {
      setEditLoading(false);
    }
  };

  // Aktivite silme
  const handleDeleteAktivite = async (aktiviteId: number) => {
    try {
      await aktiviteApi.deleteAktivite(aktiviteId);
      setAktiviteler(prev => prev.filter(a => a.id !== aktiviteId));
    } catch (err) {
      console.error('Aktivite silme hatası:', err);
    }
  };

  // Liste oluşturma
  const handleCreateListe = async () => {
    if (!listeForm.ad.trim()) return;
    setListeLoading(true);
    try {
      const yeniListe = await listeApi.create({
        ad: listeForm.ad,
        aciklama: listeForm.aciklama,
        herkeseAcik: listeForm.herkeseAcik,
      });
      setListeler(prev => [yeniListe, ...prev]);
      setShowListeModal(false);
      setListeForm({ ad: '', aciklama: '', herkeseAcik: true });
    } catch (err) {
      console.error('Liste oluşturma hatası:', err);
    } finally {
      setListeLoading(false);
    }
  };

  // Liste silme
  const handleDeleteListe = async (listeId: number) => {
    try {
      await listeApi.delete(listeId);
      setListeler(prev => prev.filter(l => l.id !== listeId));
    } catch (err) {
      console.error('Liste silme hatası:', err);
    }
  };

  // Takip et/bırak (toggle - aynı endpoint)
  const handleToggleFollow = async () => {
    if (!requireAuth('takip etmek')) return;
    if (!profil) return;

    setFollowLoading(true);
    try {
      // Backend toggle yapar, profil.id (GUID) kullan
      const result = await kullaniciApi.takipEt(profil.id);
      setProfil((prev) =>
        prev
          ? {
              ...prev,
              takipEdiyorMu: result.takipEdiyor,
              takipEdenSayisi: result.takipEdiyor
                ? prev.takipEdenSayisi + 1
                : prev.takipEdenSayisi - 1,
            }
          : null
      );
    } catch (err) {
      console.error('Takip hatası:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  // Kütüphane filtreleme - Proje isteri 2.1.5: İzlediklerim, İzlenecekler, Okuduklarım, Okunacaklar
  const izlediklerim = kutuphane.filter((k) => {
    const tur = (k.tur || k.icerikTur || '').toLowerCase();
    const durum = (k.durum || k.durumStr || '').toLowerCase();
    return (tur === 'film' || tur === 'dizi') && (durum === 'izlendi' || durum === 'izledim');
  });
  
  const izlenecekler = kutuphane.filter((k) => {
    const tur = (k.tur || k.icerikTur || '').toLowerCase();
    const durum = (k.durum || k.durumStr || '').toLowerCase();
    return (tur === 'film' || tur === 'dizi') && (durum === 'izlenecek' || durum === 'izleniyor');
  });
  
  const okuduklarim = kutuphane.filter((k) => {
    const tur = (k.tur || k.icerikTur || '').toLowerCase();
    const durum = (k.durum || k.durumStr || '').toLowerCase();
    return tur === 'kitap' && (durum === 'okundu' || durum === 'okudum');
  });
  
  const okunacaklar = kutuphane.filter((k) => {
    const tur = (k.tur || k.icerikTur || '').toLowerCase();
    const durum = (k.durum || k.durumStr || '').toLowerCase();
    return tur === 'kitap' && (durum === 'okunacak' || durum === 'okunuyor');
  });
  
  // Toplam film ve kitap sayıları (istatistikler için)
  const filmler = kutuphane.filter((k) => {
    const tur = k.tur || k.icerikTur || '';
    return tur.toLowerCase() === 'film' || tur.toLowerCase() === 'dizi';
  });
  const kitaplar = kutuphane.filter((k) => {
    const tur = k.tur || k.icerikTur || '';
    return tur.toLowerCase() === 'kitap';
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-32 h-32 skeleton rounded-full mx-auto md:mx-0" />
          <div className="flex-1">
            <div className="h-8 w-48 skeleton rounded mb-4 mx-auto md:mx-0" />
            <div className="h-4 w-64 skeleton rounded mb-2 mx-auto md:mx-0" />
            <div className="h-4 w-32 skeleton rounded mx-auto md:mx-0" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[2/3] skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !profil) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="text-center py-12">
          <User size={48} className="mx-auto mb-4 text-[#8E8E93]" />
          <h2 className="text-xl font-semibold text-white mb-2">Kullanıcı Bulunamadı</h2>
          <p className="text-[#8E8E93] mb-6">{error || 'Aradığınız kullanıcı mevcut değil.'}</p>
          <Button onClick={() => navigate(-1)}>Geri Dön</Button>
        </GlassCard>
      </div>
    );
  }

  const katilimTarihi = profil.olusturulmaZamani
    ? new Date(profil.olusturulmaZamani).toLocaleDateString('tr-TR', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <GlassCard className="mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center overflow-hidden shadow-glow">
            {profil.avatarUrl ? (
              <img
                src={profil.avatarUrl}
                alt={profil.kullaniciAdi}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-4xl font-bold">
                {profil.kullaniciAdi?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
              <h1 className="text-2xl font-bold text-white">{profil.goruntulemeAdi || profil.kullaniciAdi}</h1>
            </div>

            <p className="text-[#8E8E93] mb-3">@{profil.kullaniciAdi}</p>

            {profil.biyografi && <p className="text-sm text-[#8E8E93] mb-4 max-w-md">{profil.biyografi}</p>}

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-xs text-[#636366] mb-4">
              {katilimTarihi && (
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{katilimTarihi}'den beri</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {isOwnProfile ? (
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Button variant="secondary" onClick={() => setShowEditModal(true)}>
                  <Edit3 size={16} className="mr-2" />
                  Profili Düzenle
                </Button>
                <Button variant="primary" onClick={() => setShowListeModal(true)}>
                  <Plus size={16} className="mr-2" />
                  Yeni Liste Oluştur
                </Button>
              </div>
            ) : (
              <Button
                variant={profil.takipEdiyorMu ? 'secondary' : 'primary'}
                onClick={handleToggleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : profil.takipEdiyorMu ? (
                  <Check size={16} className="mr-2" />
                ) : (
                  <Plus size={16} className="mr-2" />
                )}
                {profil.takipEdiyorMu ? 'Takip Ediliyor' : 'Takip Et'}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/[0.08]">
          <StatCard icon={<Film size={20} />} label="Film" value={filmler.length} />
          <StatCard icon={<BookOpen size={20} />} label="Kitap" value={kitaplar.length} />
          <StatCard
            icon={<Users size={20} />}
            label="Takipçi"
            value={profil.takipEdenSayisi}
          />
          <StatCard
            icon={<Star size={20} />}
            label="Puan"
            value={profil.toplamPuanlama || 0}
          />
        </div>
      </GlassCard>

      {/* Tabs - Proje isteri 2.1.5: Sekmeli Yapı */}
      <div className="mb-6">
        {/* Ana sekmeler */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <Button
            variant={activeTab === 'aktivite' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('aktivite')}
            size="sm"
          >
            <MessageCircle size={14} className="mr-1.5" />
            Aktivite
          </Button>
          <Button
            variant={activeTab === 'izlediklerim' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('izlediklerim')}
            size="sm"
          >
            <Check size={14} className="mr-1.5" />
            İzlediklerim ({izlediklerim.length})
          </Button>
          <Button
            variant={activeTab === 'izlenecekler' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('izlenecekler')}
            size="sm"
          >
            <Eye size={14} className="mr-1.5" />
            İzlenecekler ({izlenecekler.length})
          </Button>
          <Button
            variant={activeTab === 'okuduklarim' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('okuduklarim')}
            size="sm"
          >
            <BookMarked size={14} className="mr-1.5" />
            Okuduklarım ({okuduklarim.length})
          </Button>
          <Button
            variant={activeTab === 'okunacaklar' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('okunacaklar')}
            size="sm"
          >
            <BookOpen size={14} className="mr-1.5" />
            Okunacaklar ({okunacaklar.length})
          </Button>
          <Button
            variant={activeTab === 'ozel-listeler' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('ozel-listeler')}
            size="sm"
          >
            <List size={14} className="mr-1.5" />
            Özel Listeler
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'aktivite' && (
        <section>
          {aktiviteler.length > 0 ? (
            aktiviteler.map((aktivite) => (
              <ActivityCard 
                key={aktivite.id} 
                aktivite={aktivite} 
                isLoggedIn={isLoggedIn}
                showUserInfo={false}
                isOwnProfile={isOwnProfile}
                onDelete={handleDeleteAktivite}
              />
            ))
          ) : (
            <GlassPanel padding="lg" className="text-center">
              <MessageCircle size={40} className="mx-auto mb-3 text-[#8E8E93]" />
              <p className="text-[#8E8E93]">Henüz aktivite yok.</p>
            </GlassPanel>
          )}
        </section>
      )}

      {activeTab === 'izlediklerim' && (
        <section>
          {izlediklerim.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {izlediklerim.map((item) => (
                <LibraryItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <GlassPanel padding="lg" className="text-center">
              <Film size={40} className="mx-auto mb-3 text-[#8E8E93]" />
              <p className="text-[#8E8E93]">Henüz izlenen film/dizi yok.</p>
              <p className="text-xs text-[#636366] mt-2">İzlediğiniz filmleri kütüphanenize ekleyin</p>
            </GlassPanel>
          )}
        </section>
      )}

      {activeTab === 'izlenecekler' && (
        <section>
          {izlenecekler.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {izlenecekler.map((item) => (
                <LibraryItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <GlassPanel padding="lg" className="text-center">
              <Eye size={40} className="mx-auto mb-3 text-[#8E8E93]" />
              <p className="text-[#8E8E93]">İzlenecek film/dizi yok.</p>
              <p className="text-xs text-[#636366] mt-2">İzlemek istediğiniz filmleri listenize ekleyin</p>
            </GlassPanel>
          )}
        </section>
      )}

      {activeTab === 'okuduklarim' && (
        <section>
          {okuduklarim.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {okuduklarim.map((item) => (
                <LibraryItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <GlassPanel padding="lg" className="text-center">
              <BookMarked size={40} className="mx-auto mb-3 text-[#8E8E93]" />
              <p className="text-[#8E8E93]">Henüz okunan kitap yok.</p>
              <p className="text-xs text-[#636366] mt-2">Okuduğunuz kitapları kütüphanenize ekleyin</p>
            </GlassPanel>
          )}
        </section>
      )}

      {activeTab === 'okunacaklar' && (
        <section>
          {okunacaklar.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {okunacaklar.map((item) => (
                <LibraryItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <GlassPanel padding="lg" className="text-center">
              <BookOpen size={40} className="mx-auto mb-3 text-[#8E8E93]" />
              <p className="text-[#8E8E93]">Okunacak kitap yok.</p>
              <p className="text-xs text-[#636366] mt-2">Okumak istediğiniz kitapları listenize ekleyin</p>
            </GlassPanel>
          )}
        </section>
      )}

      {activeTab === 'ozel-listeler' && (
        <section>
          {/* Yeni Liste Oluştur butonu - sadece kendi profilinde */}
          {isOwnProfile && (
            <div className="mb-4">
              <Button variant="primary" onClick={() => setShowListeModal(true)}>
                <Plus size={16} className="mr-2" />
                Yeni Liste Oluştur
              </Button>
            </div>
          )}

          {listeler.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {listeler.map((liste) => (
                <GlassCard key={liste.id} className="hover:bg-white/10 transition-colors cursor-pointer" onClick={() => navigate(`/liste/${liste.id}`)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <List size={18} className="text-[#00CEC9]" />
                        <h3 className="font-semibold text-white truncate">{liste.ad}</h3>
                      </div>
                      {liste.aciklama && (
                        <p className="text-xs text-[#8E8E93] line-clamp-2 mb-2">{liste.aciklama}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-[#636366]">
                        <span>{liste.icerikSayisi} içerik</span>
                        <span>•</span>
                        <span>{liste.herkeseAcik ? 'Herkese Açık' : 'Gizli'}</span>
                      </div>
                    </div>
                    {isOwnProfile && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteListe(liste.id); }}
                        className="p-2 rounded-lg hover:bg-white/10 text-[#8E8E93] hover:text-[#fd79a8] transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassPanel padding="lg" className="text-center">
              <List size={40} className="mx-auto mb-3 text-[#8E8E93]" />
              <p className="text-[#8E8E93]">Henüz özel liste oluşturulmamış.</p>
              {isOwnProfile && (
                <Button variant="secondary" className="mt-4" onClick={() => setShowListeModal(true)}>
                  <Plus size={16} className="mr-2" />
                  İlk Listeni Oluştur
                </Button>
              )}
            </GlassPanel>
          )}
        </section>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">Profili Düzenle</h2>
            
            <div className="space-y-5">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center">
                <label className="block text-sm text-[#8E8E93] mb-3">Profil Fotoğrafı</label>
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center">
                    {avatarPreview || editForm.avatarUrl ? (
                      <img
                        src={avatarPreview || editForm.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={40} className="text-white" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    {avatarUploading ? (
                      <Loader2 size={24} className="text-white animate-spin" />
                    ) : (
                      <Camera size={24} className="text-white" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-[#636366] mt-2">Tıklayarak fotoğraf yükleyin (max 2MB)</p>
              </div>

              <div>
                <label className="block text-sm text-[#8E8E93] mb-2">Görüntüleme Adı</label>
                <input
                  type="text"
                  value={editForm.goruntulemeAdi}
                  onChange={(e) => setEditForm({ ...editForm, goruntulemeAdi: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#636366] focus:outline-none focus:border-[#6C5CE7]"
                  placeholder="Görüntüleme adınız"
                />
              </div>

              <div>
                <label className="block text-sm text-[#8E8E93] mb-2">Biyografi</label>
                <textarea
                  value={editForm.biyografi}
                  onChange={(e) => setEditForm({ ...editForm, biyografi: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#636366] focus:outline-none focus:border-[#6C5CE7] resize-none h-24"
                  placeholder="Kendiniz hakkında birkaç şey yazın..."
                  maxLength={500}
                />
                <p className="text-xs text-[#636366] mt-1 text-right">{editForm.biyografi?.length || 0}/500</p>
              </div>

              {/* Manual URL Input (Optional) */}
              <div>
                <label className="block text-sm text-[#8E8E93] mb-2 flex items-center gap-2">
                  <Upload size={14} />
                  Avatar URL (Manuel)
                </label>
                <input
                  type="text"
                  value={editForm.avatarUrl}
                  onChange={(e) => {
                    setEditForm({ ...editForm, avatarUrl: e.target.value });
                    setAvatarPreview(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#636366] focus:outline-none focus:border-[#6C5CE7] text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  setShowEditModal(false);
                  setAvatarPreview(null);
                }}
              >
                İptal
              </Button>
              <Button 
                variant="primary" 
                className="flex-1"
                onClick={handleUpdateProfile}
                disabled={editLoading || avatarUploading}
              >
                {editLoading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : null}
                Kaydet
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Liste Oluştur Modal */}
      {showListeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-6">Yeni Liste Oluştur</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#8E8E93] mb-2">Liste Adı *</label>
                <input
                  type="text"
                  value={listeForm.ad}
                  onChange={(e) => setListeForm({ ...listeForm, ad: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#636366] focus:outline-none focus:border-[#6C5CE7]"
                  placeholder="Örn: En İyi Bilimkurgu Filmlerim"
                />
              </div>

              <div>
                <label className="block text-sm text-[#8E8E93] mb-2">Açıklama</label>
                <textarea
                  value={listeForm.aciklama}
                  onChange={(e) => setListeForm({ ...listeForm, aciklama: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#636366] focus:outline-none focus:border-[#6C5CE7] resize-none h-20"
                  placeholder="Bu liste hakkında kısa bir açıklama..."
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setListeForm({ ...listeForm, herkeseAcik: !listeForm.herkeseAcik })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    listeForm.herkeseAcik ? 'bg-[#00b894]' : 'bg-white/20'
                  } relative`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      listeForm.herkeseAcik ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className="text-sm text-[#8E8E93]">Herkese açık</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  setShowListeModal(false);
                  setListeForm({ ad: '', aciklama: '', herkeseAcik: true });
                }}
              >
                İptal
              </Button>
              <Button 
                variant="primary" 
                className="flex-1"
                onClick={handleCreateListe}
                disabled={listeLoading || !listeForm.ad.trim()}
              >
                {listeLoading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : null}
                Oluştur
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
