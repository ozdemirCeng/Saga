import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Star,
  Calendar,
  Loader2,
  MessageSquare,
  ThumbsUp,
  Sparkles,
  Film,
  Tv,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Yorum } from '../../services/api';

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
  variant?: 'primary' | 'secondary' | 'ghost';
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
      return <Film size={14} className="text-[#6C5CE7]" />;
    case 'dizi':
      return <Tv size={14} className="text-[#00CEC9]" />;
    case 'kitap':
      return <BookOpen size={14} className="text-[#fdcb6e]" />;
    default:
      return <Film size={14} className="text-[#8E8E93]" />;
  }
}

type TabType = 'yorumlar' | 'aktiviteler';

export default function LikesPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('yorumlar');
  const [begenilenYorumlar, setBegenilenYorumlar] = useState<Yorum[]>([]);
  const [loading, setLoading] = useState(true);

  // Beğenilen yorumları yükle
  useEffect(() => {
    const loadBegeniler = async () => {
      if (!isAuthenticated || !user) return;
      
      setLoading(true);
      try {
        // Not: Backend'de beğenilen yorumları getiren endpoint olmayabilir
        // Bu demo amaçlı - gerçek implementasyon için backend endpoint gerekli
        // Şimdilik boş array döndürüyoruz
        setBegenilenYorumlar([]);
      } catch (err) {
        console.error('Beğeniler yüklenirken hata:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadBegeniler();
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#fd79a8]/10 to-[#6C5CE7]/10" />
          
          <div className="relative bg-[rgba(20,20,35,0.85)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] p-8 lg:p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#fd79a8]/20 to-[#fd79a8]/5 border border-[#fd79a8]/20 flex items-center justify-center mx-auto mb-6">
              <Heart size={36} className="text-[#fd79a8]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Giriş Yapmalısınız</h2>
            <p className="text-[rgba(255,255,255,0.5)] mb-8 max-w-md mx-auto">
              Beğenilerinizi görüntülemek ve takip etmek için hesabınıza giriş yapın.
            </p>
            <Button onClick={() => navigate('/giris')}>
              <Sparkles size={16} />
              Giriş Yap
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Enhanced */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#fd79a8]/10 via-[#6C5CE7]/5 to-transparent" />
        
        <div className="relative bg-[rgba(20,20,35,0.7)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#fd79a8]/20 to-[#fd79a8]/5 border border-[#fd79a8]/20">
              <Heart size={24} className="text-[#fd79a8]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Beğeniler</h1>
              <p className="text-[rgba(255,255,255,0.4)] text-sm mt-0.5">
                Beğendiğiniz içerikler ve yorumlar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Enhanced */}
      <div className="flex gap-2 p-1 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
        <button
          onClick={() => setActiveTab('yorumlar')}
          className={`
            flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'yorumlar'
              ? 'bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white shadow-lg shadow-[#6C5CE7]/20'
              : 'text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare size={16} />
            Yorumlar
          </div>
        </button>
        <button
          onClick={() => setActiveTab('aktiviteler')}
          className={`
            flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'aktiviteler'
              ? 'bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white shadow-lg shadow-[#6C5CE7]/20'
              : 'text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <ThumbsUp size={16} />
            Aktiviteler
          </div>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Heart size={32} className="text-[#fd79a8]/30" />
            </div>
            <Loader2 size={32} className="animate-spin text-[#6C5CE7]" />
          </div>
          <p className="text-[rgba(255,255,255,0.4)] text-sm mt-4">Beğeniler yükleniyor...</p>
        </div>
      ) : activeTab === 'yorumlar' ? (
        begenilenYorumlar.length > 0 ? (
          <div className="space-y-3">
            {begenilenYorumlar.map((yorum) => (
              <div 
                key={yorum.id} 
                className="group relative rounded-xl bg-[rgba(20,20,35,0.65)] backdrop-blur-xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(253,121,168,0.3)] transition-all duration-300 overflow-hidden"
              >
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-[rgba(253,121,168,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative p-4">
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#fd79a8] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#6C5CE7]/20">
                      {yorum.kullaniciAdi?.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-white">{yorum.kullaniciAdi}</span>
                        {yorum.puan && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF9F0A]/15 border border-[#FF9F0A]/30">
                            <Star size={12} className="text-[#FF9F0A] fill-[#FF9F0A]" />
                            <span className="text-xs text-[#FF9F0A] font-medium">{yorum.puan}/10</span>
                          </div>
                        )}
                      </div>
                      
                      {yorum.baslik && (
                        <h4 className="font-medium text-white mb-2">{yorum.baslik}</h4>
                      )}
                      
                      <p className="text-sm text-[rgba(255,255,255,0.6)] line-clamp-3 leading-relaxed">
                        {yorum.icerik}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fd79a8]/10 border border-[#fd79a8]/20">
                          <Heart size={12} className="text-[#fd79a8] fill-[#fd79a8]" />
                          <span className="text-xs text-[#fd79a8] font-medium">{yorum.begeniSayisi}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[rgba(255,255,255,0.4)]">
                          <Calendar size={12} />
                          <span>{new Date(yorum.olusturulmaZamani).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#fd79a8]/5 to-[#6C5CE7]/5" />
            
            <div className="relative bg-[rgba(20,20,35,0.7)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] p-8 lg:p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mx-auto mb-6">
                <MessageSquare size={32} className="text-[rgba(255,255,255,0.2)]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Beğenilen Yorum Yok</h2>
              <p className="text-[rgba(255,255,255,0.4)] mb-8 max-w-md mx-auto">
                Henüz hiçbir yorumu beğenmediniz. İçerikleri keşfedin ve beğendiğiniz yorumları kaydedin.
              </p>
              <Button onClick={() => navigate('/kesfet')}>
                <Sparkles size={16} />
                Keşfet
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/5 to-[#00CEC9]/5" />
          
          <div className="relative bg-[rgba(20,20,35,0.7)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] p-8 lg:p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mx-auto mb-6">
              <ThumbsUp size={32} className="text-[rgba(255,255,255,0.2)]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Beğenilen Aktivite Yok</h2>
            <p className="text-[rgba(255,255,255,0.4)] mb-8 max-w-md mx-auto">
              Henüz hiçbir aktiviteyi beğenmediniz. Akışı kontrol edin ve beğendiğiniz paylaşımları kaydedin.
            </p>
            <Button onClick={() => navigate('/')}>
              <Heart size={16} />
              Akışa Git
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
