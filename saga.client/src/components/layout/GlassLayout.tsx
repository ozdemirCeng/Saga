import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, User, Search } from 'lucide-react';
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
  const { user, isAuthenticated } = useAuth();

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
    } else if (path === '/ara') {
      navigate('/kesfet');
    } else {
      navigate(path);
    }
  };

  return (
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
    </div>
  );
}
