import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  BookOpen,
  List,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
  Heart,
  Bell,
  Search,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bildirimApi, kullaniciApi } from '../../services/api';
import type { Kullanici } from '../../services/api';
import { setRefreshSidebarBildirim } from '../../pages/NotificationsPage';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Kullanıcı arama state'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Kullanici[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Okunmamış bildirim sayısını al
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await bildirimApi.getOkunmamisSayisi();
      setUnreadCount(count);
    } catch (err) {
      console.error('Bildirim sayısı alınamadı:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchUnreadCount();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Refresh fonksiyonunu kaydet
    setRefreshSidebarBildirim(fetchUnreadCount);
    
    return () => {
      clearInterval(interval);
      setRefreshSidebarBildirim(() => {});
    };
  }, [isAuthenticated, fetchUnreadCount]);

  // Kullanıcı arama - debounce ile
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await kullaniciApi.ara(searchQuery.trim(), 8);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Kullanıcı arama hatası:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Dışarı tıklanınca arama sonuçlarını kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserClick = (kullaniciAdi: string) => {
    navigate(`/profil/${kullaniciAdi}`);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    searchInputRef.current?.focus();
  };

  // Ana navigasyon öğeleri
  const mainNavItems: NavItem[] = [
    { path: '/', icon: Home, label: 'Akış' },
    { path: '/kesfet', icon: Compass, label: 'Keşfet' },
  ];

  // Kullanıcı özelleri (giriş yapmış kullanıcılar için)
  const userNavItems: NavItem[] = isAuthenticated ? [
    { path: '/kutuphane', icon: BookOpen, label: 'Kütüphanem' },
    { path: '/listelerim', icon: List, label: 'Listelerim' },
    { path: '/begeniler', icon: Heart, label: 'Beğeniler' },
    { path: '/bildirimler', icon: Bell, label: 'Bildirimler', badge: unreadCount },
  ] : [];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    const basePath = path.split('?')[0];
    return location.pathname.startsWith(basePath);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <div className="flex flex-col h-full p-5">
      {/* ===== LOGO ===== */}
      <div 
        className="flex items-center gap-3 mb-6 cursor-pointer group"
        onClick={() => handleNavClick('/')}
      >
        <div className="
          w-10 h-10 rounded-xl
          bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9]
          flex items-center justify-center
          shadow-lg shadow-[#6C5CE7]/30
          group-hover:scale-105 transition-transform
        ">
          <Sparkles size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Saga
          </h1>
          <span className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase tracking-widest">
            Social Library
          </span>
        </div>
      </div>

      {/* ===== KULLANICI ARAMA ===== */}
      <div ref={searchRef} className="relative mb-6">
        <div className="relative">
          <Search 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" 
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            className="
              w-full pl-9 pr-8 py-2.5
              rounded-xl
              bg-[rgba(255,255,255,0.05)]
              border border-[rgba(255,255,255,0.08)]
              text-white text-sm
              placeholder:text-[rgba(255,255,255,0.35)]
              focus:outline-none focus:border-[#6C5CE7]/50
              focus:bg-[rgba(255,255,255,0.08)]
              transition-all
            "
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
            >
              {searchLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <X size={14} />
              )}
            </button>
          )}
        </div>

        {/* Arama Sonuçları Dropdown */}
        {showSearchResults && (searchResults.length > 0 || searchLoading) && (
          <div className="
            absolute top-full left-0 right-0 mt-2
            bg-[rgba(20,20,35,0.98)]
            backdrop-blur-xl
            border border-[rgba(255,255,255,0.1)]
            rounded-xl
            overflow-hidden
            shadow-xl
            z-50
            max-h-80 overflow-y-auto
          ">
            {searchLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-[#6C5CE7]" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((kullanici) => (
                  <button
                    key={kullanici.id}
                    onClick={() => handleUserClick(kullanici.kullaniciAdi)}
                    className="
                      w-full px-3 py-2.5
                      flex items-center gap-3
                      hover:bg-[rgba(255,255,255,0.06)]
                      transition-colors
                    "
                  >
                    {/* Avatar */}
                    <div className="
                      w-9 h-9 rounded-full
                      bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9]
                      flex items-center justify-center
                      overflow-hidden
                      flex-shrink-0
                    ">
                      {kullanici.avatarUrl ? (
                        <img 
                          src={kullanici.avatarUrl} 
                          alt={kullanici.kullaniciAdi}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {kullanici.kullaniciAdi?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {kullanici.goruntulemeAdi || kullanici.kullaniciAdi}
                      </p>
                      <p className="text-xs text-[rgba(255,255,255,0.5)] truncate">
                        @{kullanici.kullaniciAdi}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-[rgba(255,255,255,0.4)]">
                        {kullanici.takipEdenSayisi || 0} takipçi
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery && !searchLoading ? (
              <div className="py-6 text-center">
                <p className="text-sm text-[rgba(255,255,255,0.5)]">
                  Kullanıcı bulunamadı
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ===== MAIN NAVIGATION ===== */}
      <nav className="flex-1 space-y-1">
        {/* Ana Menü */}
        <div className="mb-6">
          <p className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-widest mb-3 px-3">
            Menü
          </p>
          {mainNavItems.map((item) => (
            <NavButton
              key={item.path}
              item={item}
              isActive={isActive(item.path)}
              onClick={() => handleNavClick(item.path)}
            />
          ))}
        </div>

        {/* Kullanıcı Menüsü */}
        {isAuthenticated && userNavItems.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-widest mb-3 px-3">
              Kütüphane
            </p>
            {userNavItems.map((item) => (
              <NavButton
                key={item.path}
                item={item}
                isActive={isActive(item.path)}
                onClick={() => handleNavClick(item.path)}
              />
            ))}
          </div>
        )}
      </nav>

      {/* ===== USER PROFILE CARD (Bottom) ===== */}
      <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.06)]">
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="
                w-full p-3 rounded-xl
                flex items-center gap-3
                bg-[rgba(255,255,255,0.03)]
                hover:bg-[rgba(255,255,255,0.06)]
                transition-colors
              "
            >
              {/* Avatar */}
              <div className="
                w-10 h-10 rounded-full
                bg-gradient-to-br from-[#6C5CE7] to-[#fd79a8]
                flex items-center justify-center
                overflow-hidden
                ring-2 ring-[rgba(255,255,255,0.1)]
              ">
                {user.profilResmi ? (
                  <img 
                    src={user.profilResmi} 
                    alt={user.kullaniciAdi}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold">
                    {user.kullaniciAdi?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.goruntulemeAdi || user.kullaniciAdi}
                </p>
                <p className="text-xs text-[rgba(255,255,255,0.4)] truncate">
                  @{user.kullaniciAdi}
                </p>
              </div>

              <ChevronDown 
                size={16} 
                className={`text-[rgba(255,255,255,0.4)] transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="
                absolute bottom-full left-0 right-0 mb-2
                bg-[rgba(20,20,35,0.95)]
                backdrop-blur-xl
                border border-[rgba(255,255,255,0.08)]
                rounded-xl
                overflow-hidden
                shadow-xl
                animate-scale-in
              ">
                <button
                  onClick={() => {
                    navigate(`/profil/${user.kullaniciAdi}`);
                    setShowUserMenu(false);
                  }}
                  className="
                    w-full px-4 py-3
                    flex items-center gap-3
                    text-sm text-[rgba(255,255,255,0.8)]
                    hover:bg-[rgba(255,255,255,0.05)]
                    transition-colors
                  "
                >
                  <User size={16} />
                  Profilim
                </button>
                <button
                  onClick={() => {
                    navigate('/ayarlar');
                    setShowUserMenu(false);
                  }}
                  className="
                    w-full px-4 py-3
                    flex items-center gap-3
                    text-sm text-[rgba(255,255,255,0.8)]
                    hover:bg-[rgba(255,255,255,0.05)]
                    transition-colors
                  "
                >
                  <Settings size={16} />
                  Ayarlar
                </button>
                <div className="border-t border-[rgba(255,255,255,0.06)]" />
                <button
                  onClick={handleLogout}
                  className="
                    w-full px-4 py-3
                    flex items-center gap-3
                    text-sm text-[#FF6B6B]
                    hover:bg-[rgba(255,107,107,0.1)]
                    transition-colors
                  "
                >
                  <LogOut size={16} />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => navigate('/giris')}
              className="
                w-full py-3 px-4
                rounded-xl
                bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9]
                text-white font-semibold text-sm
                hover:shadow-lg hover:shadow-[#6C5CE7]/30
                transition-all
              "
            >
              Giriş Yap
            </button>
            <button
              onClick={() => navigate('/kayit')}
              className="
                w-full py-3 px-4
                rounded-xl
                bg-[rgba(255,255,255,0.05)]
                border border-[rgba(255,255,255,0.08)]
                text-white font-medium text-sm
                hover:bg-[rgba(255,255,255,0.08)]
                transition-all
              "
            >
              Kayıt Ol
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// NavButton Component
interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ item, isActive, onClick }: NavButtonProps) {
  const Icon = item.icon;
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full px-3 py-2.5
        rounded-xl
        flex items-center gap-3
        text-sm font-medium
        transition-all duration-200
        ${isActive
          ? 'bg-gradient-to-r from-[#6C5CE7]/20 to-[#00CEC9]/10 text-white border-l-2 border-[#6C5CE7]'
          : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
        }
      `}
    >
      <Icon size={18} className={isActive ? 'text-[#6C5CE7]' : ''} />
      <span>{item.label}</span>
      {item.badge && item.badge > 0 && (
        <span className="
          ml-auto px-2 py-0.5
          rounded-full
          bg-[#6C5CE7]
          text-white text-[10px] font-bold
        ">
          {item.badge}
        </span>
      )}
    </button>
  );
}
