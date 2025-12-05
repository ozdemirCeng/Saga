import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, Search, X, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { aktiviteApi, kullaniciApi } from "../../services/api";
import type { Aktivite, Kullanici } from "../../services/api";
import { ActivityCard } from "../../components/ActivityCard";

// ============================================
// NEBULA GLASS CARD COMPONENT
// ============================================
function NebulaCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
      p-5 rounded-2xl
      bg-[rgba(20,20,35,0.65)]
      backdrop-blur-xl
      border border-[rgba(255,255,255,0.08)]
      shadow-lg
      ${className}
    `}
    >
      {children}
    </div>
  );
}

// ============================================
// SKELETON LOADER - Nebula Style
// ============================================

function ActivitySkeleton() {
  return (
    <NebulaCard>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-[rgba(255,255,255,0.05)] rounded animate-pulse mb-2" />
          <div className="h-3 w-20 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" />
        </div>
      </div>
      <div className="aspect-video rounded-xl bg-[rgba(255,255,255,0.05)] animate-pulse" />
    </NebulaCard>
  );
}

// ============================================
// EMPTY STATE - Nebula Style
// ============================================

function EmptyState({ isLoggedIn }: { isLoggedIn: boolean }) {
  const navigate = useNavigate();

  return (
    <NebulaCard className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#6C5CE7]/20 to-[#00CEC9]/10 border border-[rgba(108,92,231,0.2)] flex items-center justify-center">
        <Sparkles size={36} className="text-[#6C5CE7]" />
      </div>
      <h3
        className="text-xl font-semibold text-white mb-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Henüz aktivite yok
      </h3>
      <p className="text-[rgba(255,255,255,0.5)] mb-6 max-w-xs mx-auto">
        {isLoggedIn
          ? "Kullanıcıları takip ederek aktivitelerini burada görün."
          : "Keşfet sayfasından içerikleri inceleyebilirsiniz."}
      </p>
      <button
        onClick={() => navigate("/kesfet")}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white font-semibold hover:shadow-lg hover:shadow-[#6C5CE7]/30 transition-all"
      >
        Keşfet
      </button>
    </NebulaCard>
  );
}

// ============================================
// MAIN FEED PAGE - Nebula Style
// ============================================

export default function FeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [aktiviteler, setAktiviteler] = useState<Aktivite[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sayfa, setSayfa] = useState(1);
  const [toplamSayfa, setToplamSayfa] = useState(1);
  const [filter, setFilter] = useState<"hepsi" | "takip">("hepsi");
  
  // Kullanıcı arama state'leri
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Kullanici[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Kullanıcı arama
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await kullaniciApi.ara(searchQuery);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Kullanıcı arama hatası:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Dışarı tıklanınca arama sonuçlarını kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Aktiviteleri yükle
  const fetchAktiviteler = useCallback(
    async (
      page: number,
      append: boolean = false,
      currentFilter?: "hepsi" | "takip"
    ) => {
      try {
        if (page === 1) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        const filterToUse = currentFilter ?? filter;
        let result;

        if (user && filterToUse === "takip") {
          result = await aktiviteApi.getFeed({ sayfa: page, limit: 15 });
        } else {
          result = await aktiviteApi.getGenelFeed({ sayfa: page, limit: 15 });
        }

        if (append) {
          setAktiviteler((prev) => [...prev, ...result.data]);
        } else {
          setAktiviteler(result.data);
        }
        setToplamSayfa(result.toplamSayfa);
      } catch (err: any) {
        console.error("Feed yükleme hatası:", err);
        setError(
          err.response?.data?.message ||
            "Aktiviteler yüklenirken bir hata oluştu."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [] // Boş dependency - fonksiyon değişmeyecek
  );

  // İlk yükleme ve filter/user değiştiğinde yeniden yükle
  useEffect(() => {
    setSayfa(1);
    fetchAktiviteler(1, false, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, user?.id]);

  const handleLoadMore = () => {
    if (sayfa < toplamSayfa && !loadingMore) {
      const nextPage = sayfa + 1;
      setSayfa(nextPage);
      fetchAktiviteler(nextPage, true, filter);
    }
  };

  const handleRefresh = () => {
    setSayfa(1);
    fetchAktiviteler(1, false, filter);
  };

  return (
    <div className="p-6 pb-24 lg:pb-6">
      <div className="max-w-[600px] mx-auto">
        
        {/* Kullanıcı Arama - Search Bar (Sadece Mobil) */}
        <div ref={searchRef} className="relative mb-6 lg:hidden">
          <div className="relative">
            <Search 
              size={18} 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]" 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowSearchResults(true)}
              placeholder="Kullanıcı ara..."
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#6C5CE7]/50 focus:bg-[rgba(255,255,255,0.08)] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                <X size={16} className="text-[rgba(255,255,255,0.5)]" />
              </button>
            )}
            {searchLoading && (
              <Loader2 
                size={16} 
                className="absolute right-10 top-1/2 -translate-y-1/2 text-[#6C5CE7] animate-spin" 
              />
            )}
          </div>

          {/* Arama Sonuçları Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[rgba(20,20,35,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2 border-b border-[rgba(255,255,255,0.08)]">
                <span className="text-xs text-[rgba(255,255,255,0.5)] px-2">
                  {searchResults.length} kullanıcı bulundu
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {searchResults.map((kullanici) => (
                  <button
                    key={kullanici.id}
                    onClick={() => {
                      navigate(`/profil/${kullanici.kullaniciAdi}`);
                      setShowSearchResults(false);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {kullanici.avatarUrl ? (
                        <img 
                          src={kullanici.avatarUrl} 
                          alt={kullanici.kullaniciAdi} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users size={18} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-white font-medium truncate">
                        {kullanici.goruntulenmeAdi || kullanici.kullaniciAdi}
                      </p>
                      <p className="text-xs text-[rgba(255,255,255,0.5)] truncate">
                        @{kullanici.kullaniciAdi}
                      </p>
                    </div>
                    <div className="text-xs text-[rgba(255,255,255,0.4)]">
                      {kullanici.takipciSayisi || 0} takipçi
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sonuç bulunamadı */}
          {showSearchResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && !searchLoading && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[rgba(20,20,35,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl p-4 text-center z-50">
              <Users size={24} className="mx-auto mb-2 text-[rgba(255,255,255,0.3)]" />
              <p className="text-sm text-[rgba(255,255,255,0.5)]">Kullanıcı bulunamadı</p>
            </div>
          )}
        </div>

        {/* Filter Tabs - Nebula Style */}
        {user && (
          <div className="flex p-1 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] mb-6">
            <button
              onClick={() => setFilter("hepsi")}
              className={`flex-1 py-2.5 px-4 text-center text-sm font-medium rounded-lg transition-all ${
                filter === "hepsi"
                  ? "bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white shadow-lg"
                  : "text-[rgba(255,255,255,0.5)] hover:text-white"
              }`}
            >
              Herkes
            </button>
            <button
              onClick={() => setFilter("takip")}
              className={`flex-1 py-2.5 px-4 text-center text-sm font-medium rounded-lg transition-all ${
                filter === "takip"
                  ? "bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white shadow-lg"
                  : "text-[rgba(255,255,255,0.5)] hover:text-white"
              }`}
            >
              Takip Ettiklerim
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <NebulaCard className="text-center py-8 mb-4">
            <p className="text-[#FF6B6B] mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-white font-medium hover:bg-[rgba(255,255,255,0.12)] transition-all"
            >
              Tekrar Dene
            </button>
          </NebulaCard>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {aktiviteler.length === 0 ? (
              <EmptyState isLoggedIn={!!user} />
            ) : (
              <div className="flex flex-col gap-4">
                {aktiviteler.map((aktivite) => (
                  <ActivityCard
                    key={aktivite.id}
                    aktivite={aktivite}
                    isLoggedIn={!!user}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {sayfa < toplamSayfa && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white font-medium hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-50 transition-all"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Yükleniyor...
                    </span>
                  ) : (
                    "Daha Fazla Göster"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
