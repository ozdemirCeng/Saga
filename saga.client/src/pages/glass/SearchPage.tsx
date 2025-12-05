import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, X, Loader2 } from "lucide-react";
import { kullaniciApi } from "../../services/api";

interface SearchResult {
  id: string;
  kullaniciAdi: string;
  goruntulenmeAdi?: string;
  avatarUrl?: string;
  biyografi?: string;
  takipciSayisi?: number;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setSearched(false);
        return;
      }

      setLoading(true);
      setSearched(true);
      try {
        const response = await kullaniciApi.ara(query.trim());
        setResults(response || []);
      } catch (error) {
        console.error("Arama hatası:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[rgba(10,10,18,0.8)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)]">
        <div className="p-4">
          <h1 className="text-xl font-bold text-white mb-4">Kullanıcı Ara</h1>

          {/* Search Input */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kullanıcı adı veya isim ara..."
              autoFocus
              className="w-full pl-12 pr-10 py-3 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-white/40 focus:outline-none focus:border-[#6C5CE7] transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-[#6C5CE7]" />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => navigate(`/profil/${user.kullaniciAdi}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(108,92,231,0.3)] transition-all text-left"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.kullaniciAdi}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">
                    {user.goruntulenmeAdi || user.kullaniciAdi}
                  </p>
                  <p className="text-sm text-white/50 truncate">
                    @{user.kullaniciAdi}
                  </p>
                  {user.biyografi && (
                    <p className="text-xs text-white/40 truncate mt-0.5">
                      {user.biyografi}
                    </p>
                  )}
                </div>
                {user.takipciSayisi !== undefined && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-white/70">
                      {user.takipciSayisi}
                    </p>
                    <p className="text-xs text-white/40">takipçi</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : searched && query.length >= 2 ? (
          <div className="text-center py-12">
            <User size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/60">"{query}" için sonuç bulunamadı</p>
            <p className="text-sm text-white/40 mt-1">
              Farklı bir arama terimi deneyin
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/60">Kullanıcı aramak için yazın</p>
            <p className="text-sm text-white/40 mt-1">En az 2 karakter girin</p>
          </div>
        )}
      </div>
    </div>
  );
}
