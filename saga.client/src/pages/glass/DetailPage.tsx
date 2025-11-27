import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Star,
  Film,
  BookOpen,
  ArrowLeft,
  Plus,
  Check,
  Play,
  Eye,
  BookMarked,
  Heart,
  MessageCircle,
  Send,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  List,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { icerikApi, yorumApi, puanlamaApi, kutuphaneApi, listeApi } from '../../services/api';
import type { Icerik, Yorum, YorumCreateDto, Liste } from '../../services/api';

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
  onClick?: (e: React.MouseEvent) => void;
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

function StarRating({ value, onChange, size = 'md', readonly = false }: { value: number; onChange?: (val: number) => void; size?: 'sm' | 'md' | 'lg'; readonly?: boolean }) {
  const sizes = { sm: 14, md: 20, lg: 26 };
  const starSize = sizes[size];
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            size={starSize}
            className={star <= value ? 'text-[#f39c12] fill-[#f39c12]' : 'text-[rgba(255,255,255,0.2)]'}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBadge({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-xs px-1.5 py-0.5', md: 'text-sm px-2 py-1', lg: 'text-base px-3 py-1.5' };
  return (
    <div className={`inline-flex items-center gap-1 bg-[#6C5CE7]/20 backdrop-blur-md rounded-md ${sizes[size]}`}>
      <Star size={size === 'sm' ? 10 : size === 'md' ? 12 : 14} className="text-[#6C5CE7] fill-[#6C5CE7]" />
      <span className="text-white font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
}

function Textarea({ placeholder, value, onChange, rows = 4, className = '' }: { placeholder?: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number; className?: string }) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      className={`w-full px-4 py-3 rounded-xl text-white text-sm bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 focus:border-transparent placeholder:text-[rgba(255,255,255,0.4)] resize-none ${className}`}
    />
  );
}

// ============================================
// COMMENT COMPONENT
// ============================================

interface CommentCardProps {
  yorum: Yorum;
  onLike: (yorumId: number) => void;
  onReply?: (yorumId: number) => void;
}

function CommentCard({ yorum, onLike, onReply }: CommentCardProps) {
  const navigate = useNavigate();
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const tarihStr = formatDistanceToNow(new Date(yorum.olusturulmaZamani), {
    addSuffix: true,
    locale: tr,
  });

  const content = yorum.icerik || yorum.icerikOzet || '';

  return (
    <GlassPanel padding="md" className="mb-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center cursor-pointer overflow-hidden"
          onClick={() => navigate(`/profil/${yorum.kullaniciAdi}`)}
        >
          {yorum.kullaniciAvatar ? (
            <img src={yorum.kullaniciAvatar} alt={yorum.kullaniciAdi} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-semibold text-sm">
              {yorum.kullaniciAdi?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-semibold text-white cursor-pointer hover:text-[#6C5CE7] transition-colors"
              onClick={() => navigate(`/profil/${yorum.kullaniciAdi}`)}
            >
              {yorum.kullaniciAdi}
            </span>
            {yorum.puan && (
              <div className="flex items-center gap-1">
                <Star size={14} className="text-[#f39c12] fill-[#f39c12]" />
                <span className="text-sm font-semibold text-[#f39c12]">{yorum.puan}</span>
              </div>
            )}
            {yorum.spoilerIceriyor && (
              <span className="px-2 py-0.5 rounded-full bg-[#fd79a8]/20 text-[#fd79a8] text-xs">
                Spoiler
              </span>
            )}
          </div>
          <p className="text-xs text-[#8E8E93]">{tarihStr}</p>
        </div>
      </div>

      {/* Title */}
      {yorum.baslik && (
        <h4 className="font-semibold text-white mb-2">{yorum.baslik}</h4>
      )}

      {/* Content */}
      {yorum.spoilerIceriyor && !showSpoiler ? (
        <div
          className="p-4 rounded-xl bg-[#fd79a8]/10 border border-[#fd79a8]/20 cursor-pointer"
          onClick={() => setShowSpoiler(true)}
        >
          <div className="flex items-center gap-2 text-[#fd79a8]">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">Spoiler içeriyor. Görmek için tıklayın.</span>
          </div>
        </div>
      ) : (
        <p className="text-[#8E8E93] text-sm whitespace-pre-line">{content}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.08]">
        <button
          onClick={() => onLike(yorum.id)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            yorum.kullaniciBegendiMi ? 'text-[#fd79a8]' : 'text-[#8E8E93] hover:text-[#fd79a8]'
          }`}
        >
          <Heart size={16} fill={yorum.kullaniciBegendiMi ? 'currentColor' : 'none'} />
          <span>{yorum.begeniSayisi}</span>
        </button>
        {onReply && (
          <button
            onClick={() => onReply(yorum.id)}
            className="flex items-center gap-1.5 text-sm text-[#8E8E93] hover:text-[#6C5CE7] transition-colors"
          >
            <MessageCircle size={16} />
            <span>Yanıtla</span>
          </button>
        )}
      </div>

      {/* Replies */}
      {yorum.yanitlar && yorum.yanitlar.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-sm text-[#6C5CE7]"
          >
            {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {yorum.yanitlar.length} yanıt
          </button>
          {showReplies && (
            <div className="mt-3 pl-4 border-l-2 border-white/10">
              {yorum.yanitlar.map((yanit) => (
                <CommentCard key={yanit.id} yorum={yanit} onLike={onLike} />
              ))}
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}

// ============================================
// COMMENT FORM COMPONENT
// ============================================

interface CommentFormProps {
  icerikId: number;
  onSubmit: (yorum: Yorum) => void;
  replyTo?: number;
  onCancel?: () => void;
}

function CommentForm({ icerikId, onSubmit, replyTo, onCancel }: CommentFormProps) {
  const { user, requireAuth } = useAuth();
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [spoiler, setSpoiler] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!requireAuth('yorum yapmak')) return;
    if (!content.trim()) {
      setError('Yorum içeriği boş olamaz.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dto: YorumCreateDto = {
        icerikId,
        icerik: content,
        puan: rating > 0 ? rating : undefined,
        spoilerIceriyor: spoiler,
        ustYorumId: replyTo,
      };

      const yeniYorum = await yorumApi.create(dto);
      onSubmit(yeniYorum);
      setContent('');
      setRating(0);
      setSpoiler(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Yorum kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <GlassPanel padding="md" className="text-center">
        <p className="text-[#8E8E93] mb-3">Yorum yapmak için giriş yapmalısınız.</p>
        <Button onClick={() => requireAuth('yorum yapmak')}>Giriş Yap</Button>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel padding="md">
      <h3 className="font-semibold text-white mb-4">
        {replyTo ? 'Yanıt Yaz' : 'Yorum Yap'}
      </h3>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[rgba(255,69,58,0.15)] text-[#fd79a8] text-sm">
          {error}
        </div>
      )}

      <Textarea
        placeholder="Düşüncelerinizi paylaşın..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
      />

      {/* Rating */}
      {!replyTo && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-[#8E8E93]">Puanınız:</span>
          <StarRating value={rating} onChange={setRating} size="md" />
          {rating > 0 && (
            <span className="text-[#f39c12] font-semibold">{rating}/10</span>
          )}
        </div>
      )}

      {/* Spoiler checkbox */}
      <label className="flex items-center gap-2 mt-4 cursor-pointer">
        <input
          type="checkbox"
          checked={spoiler}
          onChange={(e) => setSpoiler(e.target.checked)}
          className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#6C5CE7] focus:ring-[#6C5CE7]"
        />
        <span className="text-sm text-[#8E8E93]">Spoiler içeriyor</span>
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-4">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            İptal
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send size={16} className="mr-2" />
              Gönder
            </>
          )}
        </Button>
      </div>
    </GlassPanel>
  );
}

// ============================================
// LIBRARY STATUS DROPDOWN
// ============================================

interface LibraryDropdownProps {
  icerikTur: string;
  currentStatus?: string;
  onChange: (status: string) => void;
  onRemove?: () => void;
  loading?: boolean;
}

function LibraryDropdown({ icerikTur, currentStatus, onChange, onRemove, loading }: LibraryDropdownProps) {
  const [open, setOpen] = useState(false);

  // Backend enum değerleri: izlendi, izlenecek, okundu, okunacak, devam_ediyor
  const filmStatuses = [
    { value: 'devam_ediyor', label: 'İzleniyor', icon: <Play size={16} /> },
    { value: 'izlendi', label: 'İzlendi', icon: <Check size={16} /> },
    { value: 'izlenecek', label: 'İzlenecek', icon: <Eye size={16} /> },
  ];

  const kitapStatuses = [
    { value: 'devam_ediyor', label: 'Okunuyor', icon: <BookOpen size={16} /> },
    { value: 'okundu', label: 'Okundu', icon: <Check size={16} /> },
    { value: 'okunacak', label: 'Okunacak', icon: <BookMarked size={16} /> },
  ];

  const statuses = icerikTur === 'film' ? filmStatuses : kitapStatuses;
  const currentLabel = statuses.find((s) => s.value === currentStatus)?.label || 'Kütüphaneye Ekle';

  return (
    <div className="relative">
      <Button
        variant={currentStatus ? 'success' : 'primary'}
        onClick={() => setOpen(!open)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : currentStatus ? (
          <Check size={16} className="mr-2" />
        ) : (
          <Plus size={16} className="mr-2" />
        )}
        {currentLabel}
        <ChevronDown size={16} className="ml-2" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-48 z-50 glass-panel p-2 animate-scale-in">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => {
                  onChange(status.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  currentStatus === status.value
                    ? 'bg-[#6C5CE7]/20 text-[#6C5CE7]'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {status.icon}
                {status.label}
              </button>
            ))}
            
            {/* Kütüphaneden Kaldır */}
            {currentStatus && onRemove && (
              <>
                <div className="border-t border-white/10 my-2" />
                <button
                  onClick={() => {
                    onRemove();
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left text-[#fd79a8] hover:bg-[#fd79a8]/10 transition-colors"
                >
                  <X size={16} />
                  Kütüphaneden Kaldır
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// LISTE DROPDOWN
// ============================================

interface ListeDropdownProps {
  icerikId: number;
}

function ListeDropdown({ icerikId }: ListeDropdownProps) {
  const { user, requireAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [listeler, setListeler] = useState<Liste[]>([]);
  const [icerikListeleri, setIcerikListeleri] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Kullanıcının listelerini yükle
  useEffect(() => {
    const loadListeler = async () => {
      if (!user || !open) return;
      setLoading(true);
      try {
        const [userListeler, icerikListeler] = await Promise.all([
          listeApi.getMyListeler(),
          listeApi.getIcerikListeleri(icerikId),
        ]);
        setListeler(userListeler);
        setIcerikListeleri(icerikListeler.map((l: Liste) => l.id));
      } catch (err) {
        console.error('Liste yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    };
    loadListeler();
  }, [user, open, icerikId]);

  const handleToggleListe = async (listeId: number) => {
    if (!requireAuth('listeye eklemek')) return;

    setActionLoading(listeId);
    try {
      if (icerikListeleri.includes(listeId)) {
        await listeApi.removeIcerik(listeId, icerikId);
        setIcerikListeleri((prev) => prev.filter((id) => id !== listeId));
      } else {
        await listeApi.addIcerik(listeId, icerikId);
        setIcerikListeleri((prev) => [...prev, listeId]);
      }
    } catch (err) {
      console.error('Liste güncelleme hatası:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const listedeVar = icerikListeleri.length > 0;

  return (
    <div className="relative">
      <Button
        variant={listedeVar ? 'secondary' : 'ghost'}
        onClick={() => {
          if (!user) {
            requireAuth('listeye eklemek');
            return;
          }
          setOpen(!open);
        }}
      >
        <List size={16} className="mr-2" />
        {listedeVar ? `${icerikListeleri.length} listede` : 'Listeye Ekle'}
        <ChevronDown size={16} className="ml-2" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-56 z-50 glass-panel p-2 animate-scale-in max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin text-[#8E8E93]" />
              </div>
            ) : listeler.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-[#8E8E93] mb-2">Henüz listeniz yok</p>
                <p className="text-xs text-[#8E8E93]">Profil sayfasından liste oluşturabilirsiniz</p>
              </div>
            ) : (
              listeler.map((liste) => {
                const isInList = icerikListeleri.includes(liste.id);
                const isLoading = actionLoading === liste.id;
                return (
                  <button
                    key={liste.id}
                    onClick={() => handleToggleListe(liste.id)}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      isInList
                        ? 'bg-[#00b894]/20 text-[#00b894]'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="truncate">{liste.ad}</span>
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin flex-shrink-0" />
                    ) : isInList ? (
                      <Check size={14} className="flex-shrink-0" />
                    ) : (
                      <Plus size={14} className="flex-shrink-0 opacity-50" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// MAIN DETAIL PAGE
// ============================================

export default function DetailPage() {
  const { id } = useParams<{ tip: string; id: string }>();
  const navigate = useNavigate();
  const { requireAuth } = useAuth();

  // States
  const [icerik, setIcerik] = useState<Icerik | null>(null);
  const [yorumlar, setYorumlar] = useState<Yorum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User states
  const [kullaniciPuani, setKullaniciPuani] = useState(0);
  const [kutuphaneDurumu, setKutuphaneDurumu] = useState<string | undefined>();
  const [savingRating, setSavingRating] = useState(false);
  const [savingLibrary, setSavingLibrary] = useState(false);

  // Load content
  useEffect(() => {
    const loadContent = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const icerikId = parseInt(id);
        const [icerikData, yorumlarData] = await Promise.all([
          icerikApi.getById(icerikId),
          yorumApi.getIcerikYorumlari(icerikId, { sayfaBoyutu: 20 }),
        ]);

        setIcerik(icerikData);
        setYorumlar(yorumlarData.data);

        // Kullanıcı durumları
        if (icerikData.kullaniciPuani) {
          setKullaniciPuani(icerikData.kullaniciPuani);
        }
        if (icerikData.kullanicininDurumu) {
          setKutuphaneDurumu(icerikData.kullanicininDurumu);
        }
      } catch (err: any) {
        console.error('İçerik yükleme hatası:', err);
        setError(err.response?.data?.message || 'İçerik yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [id]);

  // Puanlama kaydet
  const handleRating = async (puan: number) => {
    if (!requireAuth('puanlamak')) return;
    if (!icerik) return;

    setSavingRating(true);
    try {
      await puanlamaApi.puanla({ icerikId: icerik.id, puan });
      setKullaniciPuani(puan);
    } catch (err) {
      console.error('Puanlama hatası:', err);
    } finally {
      setSavingRating(false);
    }
  };

  // Kütüphane durumu güncelle
  const handleLibraryChange = async (durum: string) => {
    if (!requireAuth('kütüphaneye eklemek')) return;
    if (!icerik) return;

    setSavingLibrary(true);
    try {
      await kutuphaneApi.durumGuncelle(icerik.id, durum);
      setKutuphaneDurumu(durum);
    } catch (err) {
      console.error('Kütüphane hatası:', err);
    } finally {
      setSavingLibrary(false);
    }
  };

  // Kütüphaneden kaldır
  const handleLibraryRemove = async () => {
    if (!requireAuth('kütüphaneden kaldırmak')) return;
    if (!icerik) return;

    setSavingLibrary(true);
    try {
      await kutuphaneApi.kaldir(icerik.id);
      setKutuphaneDurumu(undefined);
    } catch (err) {
      console.error('Kütüphane kaldırma hatası:', err);
    } finally {
      setSavingLibrary(false);
    }
  };

  // Yorum beğeni
  const handleLikeComment = async (yorumId: number) => {
    if (!requireAuth('beğenmek')) return;

    try {
      const result = await yorumApi.toggleBegeni(yorumId);
      setYorumlar((prev) =>
        prev.map((y) =>
          y.id === yorumId
            ? { ...y, kullaniciBegendiMi: result.begendi, begeniSayisi: result.begeniSayisi }
            : y
        )
      );
    } catch (err) {
      console.error('Beğeni hatası:', err);
    }
  };

  // Yeni yorum ekle
  const handleNewComment = (yorum: Yorum) => {
    setYorumlar((prev) => [yorum, ...prev]);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-8 h-8 skeleton rounded-full" />
          <div className="h-6 w-32 skeleton rounded" />
        </div>
        <div className="flex gap-8">
          <div className="w-[280px] aspect-[2/3] skeleton rounded-2xl" />
          <div className="flex-1">
            <div className="h-8 w-3/4 skeleton rounded mb-4" />
            <div className="h-4 w-full skeleton rounded mb-2" />
            <div className="h-4 w-full skeleton rounded mb-2" />
            <div className="h-4 w-2/3 skeleton rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !icerik) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="text-center py-12">
          <AlertTriangle size={48} className="mx-auto mb-4 text-[#fd79a8]" />
          <h2 className="text-xl font-semibold text-white mb-2">İçerik Bulunamadı</h2>
          <p className="text-[#8E8E93] mb-6">{error || 'Aradığınız içerik mevcut değil.'}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-2" />
            Geri Dön
          </Button>
        </GlassCard>
      </div>
    );
  }

  const yil = icerik.yayinTarihi?.split('-')[0];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#8E8E93] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={20} />
        <span>Geri</span>
      </button>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Poster */}
        <div className="w-full md:w-[280px] flex-shrink-0">
          <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 shadow-poster">
            {icerik.posterUrl ? (
              <img
                src={icerik.posterUrl}
                alt={icerik.baslik}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {icerik.tur === 'film' ? (
                  <Film size={64} className="text-[#8E8E93]" />
                ) : (
                  <BookOpen size={64} className="text-[#8E8E93]" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          {/* Type Badge */}
          <div className="flex items-center gap-2 mb-3">
            {icerik.tur === 'film' ? (
              <Film size={16} className="text-[#6C5CE7]" />
            ) : (
              <BookOpen size={16} className="text-[#00CEC9]" />
            )}
            <span className="text-sm text-[#8E8E93] capitalize">{icerik.tur}</span>
            {yil && <span className="text-sm text-[#8E8E93]">• {yil}</span>}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">{icerik.baslik}</h1>

          {/* Ratings */}
          <div className="flex items-center gap-6 mb-6">
            {icerik.ortalamaPuan > 0 && (
              <div>
                <p className="text-xs text-[#8E8E93] mb-1">Platform Puanı</p>
                <RatingBadge rating={icerik.ortalamaPuan} size="lg" />
              </div>
            )}
            <div>
              <p className="text-xs text-[#8E8E93] mb-1">
                {icerik.puanlamaSayisi} değerlendirme • {icerik.yorumSayisi} yorum
              </p>
            </div>
          </div>

          {/* Meta Info (Türler, Süre, Yazarlar vs.) */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            {/* Yönetmen */}
            {icerik.yonetmen && (
              <div>
                <span className="text-[#8E8E93]">Yönetmen: </span>
                <span className="text-white">{icerik.yonetmen}</span>
              </div>
            )}
            {/* Türler */}
            {icerik.turler && icerik.turler.length > 0 && (
              <div>
                <span className="text-[#8E8E93]">Tür: </span>
                <span className="text-white">{icerik.turler.join(', ')}</span>
              </div>
            )}
            {/* Süre (Film) */}
            {icerik.sure && icerik.sure > 0 && (
              <div>
                <span className="text-[#8E8E93]">Süre: </span>
                <span className="text-white">{icerik.sure} dk</span>
              </div>
            )}
            {/* Sezon/Bölüm (Dizi) */}
            {icerik.sezonSayisi && icerik.sezonSayisi > 0 && (
              <div>
                <span className="text-[#8E8E93]">Sezon: </span>
                <span className="text-white">{icerik.sezonSayisi}</span>
                {icerik.bolumSayisi && icerik.bolumSayisi > 0 && (
                  <span className="text-white"> • {icerik.bolumSayisi} bölüm</span>
                )}
              </div>
            )}
            {/* Yazarlar (Kitap) */}
            {icerik.yazarlar && icerik.yazarlar.length > 0 && (
              <div>
                <span className="text-[#8E8E93]">Yazar: </span>
                <span className="text-white">{icerik.yazarlar.join(', ')}</span>
              </div>
            )}
            {/* Sayfa Sayısı (Kitap) */}
            {icerik.sayfaSayisi && icerik.sayfaSayisi > 0 && (
              <div>
                <span className="text-[#8E8E93]">Sayfa: </span>
                <span className="text-white">{icerik.sayfaSayisi}</span>
              </div>
            )}
            {/* Yayınevi (Kitap) */}
            {icerik.yayinevi && (
              <div>
                <span className="text-[#8E8E93]">Yayınevi: </span>
                <span className="text-white">{icerik.yayinevi}</span>
              </div>
            )}
          </div>

          {/* Harici Puan (TMDB/IMDB) */}
          {icerik.hariciPuan && icerik.hariciPuan > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f39c12]/15">
                <Star size={14} className="text-[#f39c12] fill-[#f39c12]" />
                <span className="text-[#f39c12] font-semibold text-sm">{icerik.hariciPuan.toFixed(1)}</span>
                {icerik.hariciOySayisi && icerik.hariciOySayisi > 0 && (
                  <span className="text-[#f39c12]/70 text-xs">({icerik.hariciOySayisi.toLocaleString('tr-TR')} oy)</span>
                )}
              </div>
              <span className="text-[#8E8E93] text-xs">TMDB</span>
            </div>
          )}

          {/* Description */}
          {icerik.aciklama && (
            <p className="text-[#8E8E93] text-sm leading-relaxed mb-6 line-clamp-4">
              {icerik.aciklama}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <LibraryDropdown
              icerikTur={icerik.tur}
              currentStatus={kutuphaneDurumu}
              onChange={handleLibraryChange}
              onRemove={handleLibraryRemove}
              loading={savingLibrary}
            />
            <ListeDropdown
              icerikId={icerik.id}
            />
          </div>

          {/* User Rating */}
          <GlassPanel padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium mb-1">Puanınız</p>
                <p className="text-xs text-[#8E8E93]">
                  {kullaniciPuani > 0 ? `${kullaniciPuani}/10` : 'Henüz puanlamadınız'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StarRating
                  value={kullaniciPuani}
                  onChange={handleRating}
                  size="lg"
                  readonly={savingRating}
                />
                {savingRating && <Loader2 size={16} className="animate-spin text-[#8E8E93]" />}
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Cast Section - Oyuncu Kadrosu */}
      {icerik.oyuncular && icerik.oyuncular.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Oyuncu Kadrosu
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar">
            {icerik.oyuncular.slice(0, 12).map((oyuncu, index) => (
              <div key={index} className="flex-shrink-0 w-28 text-center">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-white/5 mb-2 mx-auto border-2 border-white/10">
                  {oyuncu.profilUrl ? (
                    <img
                      src={oyuncu.profilUrl}
                      alt={oyuncu.ad}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#6C5CE7]/30 to-[#00CEC9]/30">
                      <span className="text-2xl text-white font-semibold">
                        {oyuncu.ad?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-white text-sm font-medium line-clamp-1">{oyuncu.ad}</p>
                {oyuncu.karakter && (
                  <p className="text-[#8E8E93] text-xs line-clamp-1">{oyuncu.karakter}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments Section */}
      <section>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <MessageCircle size={20} />
          Yorumlar ({yorumlar.length})
        </h2>

        {/* Comment Form */}
        <div className="mb-6">
          <CommentForm icerikId={icerik.id} onSubmit={handleNewComment} />
        </div>

        {/* Comments List */}
        {yorumlar.length > 0 ? (
          <div>
            {yorumlar.map((yorum) => (
              <CommentCard
                key={yorum.id}
                yorum={yorum}
                onLike={handleLikeComment}
              />
            ))}
          </div>
        ) : (
          <GlassPanel padding="lg" className="text-center">
            <MessageCircle size={40} className="mx-auto mb-3 text-[#8E8E93]" />
            <p className="text-[#8E8E93]">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
          </GlassPanel>
        )}
      </section>
    </div>
  );
}
