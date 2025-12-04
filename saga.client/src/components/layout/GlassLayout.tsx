import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, User, Search, Settings, LogOut, MoreHorizontal, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { RightWidgets } from './RightWidgets';
import { useAuth } from '../../context/AuthContext';

export function GlassLayout() {
  const location = useLocation();
  
  // Keşfet ve içerik detay sayfalarında full-width layout kullan
  const isFullWidthPage = location.pathname.startsWith('/kesfet') || 
                          location.pathname.startsWith('/icerik/');

  return (
    <div
      className="
        min-h-screen
        text-white
      "
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(108, 92, 231, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(0, 206, 201, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(253, 121, 168, 0.05) 0%, transparent 50%),
          #0a0a12
        `,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* 3-Column Nebula Layout - Responsive */}
      <div className="min-h-screen">
        
        {/* LEFT SIDEBAR - Fixed on left, hidden on mobile */}
        <aside className="
          hidden lg:block
          fixed left-0 top-0 bottom-0 
          w-[260px] xl:w-[280px]
          z-40
          border-r border-[rgba(255,255,255,0.06)]
          bg-[rgba(10,10,18,0.5)]
          backdrop-blur-xl
          overflow-y-auto
          hide-scrollbar
        ">
          <Sidebar />
        </aside>

        {/* MAIN CONTENT - Feed Area */}
        <main className={`
          min-h-screen
          lg:ml-[260px] xl:ml-[280px]
          ${!isFullWidthPage ? 'xl:mr-[360px]' : ''}
          overflow-y-auto
          pb-20 lg:pb-0
          pt-6 lg:pt-8
        `}>
          <Outlet />
        </main>

        {/* RIGHT WIDGETS - Fixed on right, only on non-fullwidth pages */}
        {!isFullWidthPage && (
          <aside className="
            fixed right-0 top-0 bottom-0
            w-[340px] xl:w-[360px]
            bg-[rgba(10,10,18,0.3)]
            backdrop-blur-xl
            overflow-y-auto
            hide-scrollbar
            hidden xl:block
            border-l border-[rgba(255,255,255,0.06)]
          ">
            <RightWidgets />
          </aside>
        )}
      </div>

      {/* Mobile Bottom Navigation - Visible on small screens only */}
      <nav className="
        fixed bottom-0 left-0 right-0 z-50
        lg:hidden
        bg-[rgba(10,10,18,0.95)]
        backdrop-blur-xl
        border-t border-[rgba(255,255,255,0.08)]
        safe-area-bottom
      ">
        <MobileNav />
      </nav>
    </div>
  );
}

// Mobile Navigation Component
function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Akış' },
    { path: '/kesfet', icon: Compass, label: 'Keşfet' },
    { path: '/ara', icon: Search, label: 'Ara' },
    { path: '/profil', icon: User, label: 'Profil' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/profil') return location.pathname.startsWith('/profil');
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path: string) => {
    if (path === '/profil') {
      if (isAuthenticated && user) {
        navigate(`/profil/${user.kullaniciAdi}`);
      } else {
        navigate('/giris');
      }
    } else {
      navigate(path);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
    navigate('/giris');
  };

  return (
    <>
      {/* Overlay Menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMenu(false)}
        >
          <div 
            className="absolute bottom-20 left-4 right-4 bg-[rgba(20,20,35,0.95)] backdrop-blur-xl rounded-2xl border border-[rgba(255,255,255,0.1)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-white font-semibold">Menü</span>
              <button 
                onClick={() => setShowMenu(false)}
                className="p-1.5 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                <X size={20} className="text-white/60" />
              </button>
            </div>
            
            {/* User Info */}
            {isAuthenticated && user && (
              <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.kullaniciAdi} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{user.kullaniciAdi?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.goruntulenmeAdi || user.kullaniciAdi}</p>
                    <p className="text-white/50 text-sm">@{user.kullaniciAdi}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={() => {
                  navigate('/ayarlar');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(255,255,255,0.08)] transition-colors text-white/80 hover:text-white"
              >
                <Settings size={20} />
                <span>Ayarlar</span>
              </button>
              
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(255,107,107,0.15)] transition-colors text-[#ff6b6b]"
                >
                  <LogOut size={20} />
                  <span>Çıkış Yap</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavClick(item.path)}
            className={`
              flex flex-col items-center justify-center gap-0.5 
              flex-1 h-full
              transition-all duration-200
              ${isActive(item.path) 
                ? 'text-[#6C5CE7]' 
                : 'text-[rgba(255,255,255,0.5)] active:text-white'
              }
            `}
          >
            <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
        
        {/* More Button */}
        <button
          onClick={() => setShowMenu(true)}
          className={`
            flex flex-col items-center justify-center gap-0.5 
            flex-1 h-full
            transition-all duration-200
            ${showMenu 
              ? 'text-[#6C5CE7]' 
              : 'text-[rgba(255,255,255,0.5)] active:text-white'
            }
          `}
        >
          <MoreHorizontal size={22} strokeWidth={2} />
          <span className="text-[10px] font-medium">Daha</span>
        </button>
      </div>
    </>
  );
}
