import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Film,
  BookOpen,
  Star,
  Loader2,
  X,
  Tv,
  TrendingUp,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Globe,
} from "lucide-react";
import { externalApi, icerikApi } from "../../services/api";
import type { TmdbFilm, GoogleBook } from "../../services/api";
import bookQueriesConfig from "../../config/bookQueries.json";

// ============================================
// NEBULA UI COMPONENTS
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
      className={`p-5 rounded-2xl bg-[rgba(20,20,35,0.65)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

function NebulaButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variantStyles = {
    primary:
      "bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white hover:shadow-lg hover:shadow-[#6C5CE7]/25",
    secondary:
      "bg-[rgba(255,255,255,0.08)] text-white border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.12)]",
    ghost:
      "bg-transparent text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]",
  };
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// ============================================
// FILTER PANEL COMPONENT (Sağ Sidebar)
// ============================================

// TMDB türleri
const FILM_GENRES = [
  { id: 28, name: "Aksiyon" },
  { id: 12, name: "Macera" },
  { id: 16, name: "Animasyon" },
  { id: 35, name: "Komedi" },
  { id: 80, name: "Suç" },
  { id: 99, name: "Belgesel" },
  { id: 18, name: "Dram" },
  { id: 10751, name: "Aile" },
  { id: 14, name: "Fantastik" },
  { id: 36, name: "Tarih" },
  { id: 27, name: "Korku" },
  { id: 10402, name: "Müzik" },
  { id: 9648, name: "Gizem" },
  { id: 10749, name: "Romantik" },
  { id: 878, name: "Bilim Kurgu" },
  { id: 10770, name: "TV Film" },
  { id: 53, name: "Gerilim" },
  { id: 10752, name: "Savaş" },
  { id: 37, name: "Western" },
];

const TV_GENRES = [
  { id: 10759, name: "Aksiyon & Macera" },
  { id: 16, name: "Animasyon" },
  { id: 35, name: "Komedi" },
  { id: 80, name: "Suç" },
  { id: 99, name: "Belgesel" },
  { id: 18, name: "Dram" },
  { id: 10751, name: "Aile" },
  { id: 10762, name: "Çocuk" },
  { id: 9648, name: "Gizem" },
  { id: 10763, name: "Haber" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Bilim Kurgu & Fantazi" },
  { id: 10766, name: "Pembe Dizi" },
  { id: 10767, name: "Talk Show" },
  { id: 10768, name: "Savaş & Politik" },
  { id: 37, name: "Western" },
];

// "Tümü" seçiliyken kullanılacak birleşik türler (ortak ID'ler)
const COMBINED_GENRES = [
  { id: 16, name: "Animasyon" },
  { id: 35, name: "Komedi" },
  { id: 80, name: "Suç" },
  { id: 99, name: "Belgesel" },
  { id: 18, name: "Dram" },
  { id: 10751, name: "Aile" },
  { id: 9648, name: "Gizem" },
  { id: 37, name: "Western" },
];

// Film ve dizi tür eşleştirmesi (benzer türler için)
// Kullanıcı bir tür seçtiğinde, hem film hem dizi için geçerli ID'leri döndürür
const GENRE_MAPPING: { [key: number]: number[] } = {
  // Film türleri -> eşleşen tüm ID'ler
  28: [28, 10759], // Aksiyon -> Film Aksiyon + Dizi Aksiyon&Macera
  12: [12, 10759], // Macera -> Film Macera + Dizi Aksiyon&Macera
  14: [14, 10765], // Fantastik -> Film Fantastik + Dizi Bilim Kurgu&Fantazi
  878: [878, 10765], // Bilim Kurgu -> Film Bilim Kurgu + Dizi Bilim Kurgu&Fantazi
  10752: [10752, 10768], // Savaş -> Film Savaş + Dizi Savaş&Politik
  // Dizi türleri -> eşleşen tüm ID'ler
  10759: [28, 12, 10759], // Aksiyon&Macera -> kendisi + Film Aksiyon + Film Macera
  10765: [14, 878, 10765], // Bilim Kurgu&Fantazi -> kendisi + Film Fantastik + Film Bilim Kurgu
  10768: [10752, 10768], // Savaş&Politik -> kendisi + Film Savaş
  // Ortak türler (aynı ID)
  16: [16],
  35: [35],
  80: [80],
  99: [99],
  18: [18],
  10751: [10751],
  9648: [9648],
  37: [37],
  27: [27],
  10402: [10402],
  10749: [10749],
  36: [36],
  10770: [10770],
  53: [53],
  10762: [10762],
  10763: [10763],
  10764: [10764],
  10766: [10766],
  10767: [10767],
};

interface FilterPanelProps {
  // Tab
  activeTab: "tmdb" | "kitaplar";
  // TMDB filtreleri
  tmdbFilter: "all" | "movie" | "tv";
  onTmdbFilterChange: (filter: "all" | "movie" | "tv") => void;
  tmdbSort: "popular" | "top_rated" | "trending" | "now_playing";
  onTmdbSortChange: (
    sort: "popular" | "top_rated" | "trending" | "now_playing"
  ) => void;
  // Kitap filtreleri
  bookCategory: string;
  bookCategories: {
    value: string;
    label: string;
    queryEn: string;
    queryTr: string;
  }[];
  onBookCategoryChange: (category: string) => void;
  bookLang: string;
  bookLanguages: { value: string; label: string }[];
  onBookLangChange: (lang: string) => void;
  // Ortak filtreler
  minYear: number | null;
  maxYear: number | null;
  minPuan: number | null;
  selectedGenres: number[];
  onMinYearChange: (year: number | null) => void;
  onMaxYearChange: (year: number | null) => void;
  onMinPuanChange: (puan: number | null) => void;
  onGenresChange: (genres: number[]) => void;
  onApply: () => void;
  onReset: () => void;
}

function FilterPanel({
  activeTab,
  tmdbFilter,
  onTmdbFilterChange,
  tmdbSort,
  onTmdbSortChange,
  bookCategory,
  bookCategories,
  onBookCategoryChange,
  bookLang,
  bookLanguages,
  onBookLangChange,
  minYear,
  maxYear,
  minPuan,
  selectedGenres,
  onMinYearChange,
  onMaxYearChange,
  onMinPuanChange,
  onGenresChange,
  onApply,
  onReset,
}: FilterPanelProps) {
  const [showGenres, setShowGenres] = useState(true);
  const [showYearFilter, setShowYearFilter] = useState(true);
  const [showRatingFilter, setShowRatingFilter] = useState(true);
  const [showBookCategories, setShowBookCategories] = useState(true);

  // Aktif tab'a göre tür listesi
  // "Tümü" seçiliyken sadece ortak türleri göster
  const genres =
    tmdbFilter === "all"
      ? COMBINED_GENRES
      : tmdbFilter === "tv"
      ? TV_GENRES
      : FILM_GENRES;

  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      onGenresChange(selectedGenres.filter((id) => id !== genreId));
    } else {
      onGenresChange([...selectedGenres, genreId]);
    }
  };

  // Filtre sayısı
  const activeFilterCount = [
    minYear,
    maxYear,
    minPuan,
    selectedGenres.length > 0 ? selectedGenres : null,
  ].filter(Boolean).length;

  return (
    <div className="w-[300px] flex-shrink-0 sticky top-0 h-screen overflow-y-auto hide-scrollbar p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Filtreler</h3>
          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-[#fd79a8] hover:text-[#fd79a8]/80 transition-colors"
            >
              Temizle ({activeFilterCount})
            </button>
          )}
        </div>

        {/* TMDB Tab Filtreleri */}
        {activeTab === "tmdb" && (
          <>
            {/* Medya Türü */}
            <div className="glass-panel p-4 space-y-3">
              <p className="text-xs text-[#8E8E93] uppercase tracking-wider font-medium">
                Medya Türü
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "Tümü", icon: <Star size={12} /> },
                  { id: "movie", label: "Film", icon: <Film size={12} /> },
                  { id: "tv", label: "Dizi", icon: <Tv size={12} /> },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onTmdbFilterChange(f.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      tmdbFilter === f.id
                        ? "bg-[#6C5CE7] text-white"
                        : "bg-white/5 text-[#8E8E93] hover:bg-white/10"
                    }`}
                  >
                    {f.icon}
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sıralama */}
            <div className="glass-panel p-4 space-y-3">
              <p className="text-xs text-[#8E8E93] uppercase tracking-wider font-medium">
                Sıralama
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    id: "popular",
                    label: "Popüler",
                    icon: <TrendingUp size={12} />,
                  },
                  {
                    id: "top_rated",
                    label: "En Yüksek Puan",
                    icon: <Star size={12} />,
                  },
                  {
                    id: "trending",
                    label: "Trend",
                    icon: <TrendingUp size={12} />,
                  },
                  {
                    id: "now_playing",
                    label: tmdbFilter === "tv" ? "Yayında" : "Vizyonda",
                    icon: <Clock size={12} />,
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onTmdbSortChange(s.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      tmdbSort === s.id
                        ? "bg-[#00CEC9] text-white"
                        : "bg-white/5 text-[#8E8E93] hover:bg-white/10"
                    }`}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Türler */}
            <div className="glass-panel p-4 space-y-3">
              <button
                onClick={() => setShowGenres(!showGenres)}
                className="w-full flex items-center justify-between text-xs text-[#8E8E93] uppercase tracking-wider font-medium"
              >
                <span>
                  Türler{" "}
                  {selectedGenres.length > 0 && `(${selectedGenres.length})`}
                </span>
                {showGenres ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
              {showGenres && (
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {genres.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        selectedGenres.includes(genre.id)
                          ? "bg-[#6C5CE7] text-white"
                          : "bg-white/5 text-[#8E8E93] hover:bg-white/10"
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Kitap Tab Filtreleri */}
        {activeTab === "kitaplar" && (
          <>
            {/* Kitap Kategorileri */}
            <div className="glass-panel p-4 space-y-3">
              <button
                onClick={() => setShowBookCategories(!showBookCategories)}
                className="w-full flex items-center justify-between text-xs text-[#8E8E93] uppercase tracking-wider font-medium"
              >
                <span className="flex items-center gap-2">
                  <BookOpen size={12} className="text-[#00b894]" />
                  Kategori
                </span>
                {showBookCategories ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
              {showBookCategories && (
                <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
                  {bookCategories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => onBookCategoryChange(cat.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                        bookCategory === cat.value
                          ? "bg-[#00b894] text-white"
                          : "bg-white/5 text-[#8E8E93] hover:bg-white/10"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sıralama */}
            {/* Dil Filtresi */}
            <div className="glass-panel p-4 space-y-3">
              <p className="text-xs text-[#8E8E93] uppercase tracking-wider font-medium flex items-center gap-2">
                <Globe size={12} className="text-[#fd79a8]" />
                Dil
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {bookLanguages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => onBookLangChange(lang.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      bookLang === lang.value
                        ? "bg-[#fd79a8] text-white"
                        : "bg-white/5 text-[#8E8E93] hover:bg-white/10"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Yıl Filtresi - Tüm tablar için */}
        <div className="glass-panel p-4 space-y-3">
          <button
            onClick={() => setShowYearFilter(!showYearFilter)}
            className="w-full flex items-center justify-between text-xs text-[#8E8E93] uppercase tracking-wider font-medium"
          >
            <span className="flex items-center gap-2">
              <Calendar size={12} className="text-[#6C5CE7]" />
              Yayın Yılı
            </span>
            {showYearFilter ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
          {showYearFilter && (
            <div className="space-y-3">
              {/* Hızlı Seçim */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Tümü", min: null, max: null },
                  { label: "2024", min: 2024, max: 2024 },
                  { label: "2023", min: 2023, max: 2023 },
                  { label: "2020-2024", min: 2020, max: 2024 },
                  { label: "2010-2019", min: 2010, max: 2019 },
                  { label: "2000-2009", min: 2000, max: 2009 },
                  { label: "Klasik (<2000)", min: null, max: 1999 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      onMinYearChange(preset.min);
                      onMaxYearChange(preset.max);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      minYear === preset.min && maxYear === preset.max
                        ? "bg-[#6C5CE7] text-white"
                        : "bg-white/5 text-[#8E8E93] hover:bg-white/10"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {/* Custom Range */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  min="1900"
                  max="2025"
                  value={minYear || ""}
                  onChange={(e) =>
                    onMinYearChange(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full bg-white/5 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]/50 border border-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[#8E8E93] text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  min="1900"
                  max="2025"
                  value={maxYear || ""}
                  onChange={(e) =>
                    onMaxYearChange(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full bg-white/5 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]/50 border border-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Puan Filtresi */}
        <div className="glass-panel p-4 space-y-3">
          <button
            onClick={() => setShowRatingFilter(!showRatingFilter)}
            className="w-full flex items-center justify-between text-xs text-[#8E8E93] uppercase tracking-wider font-medium"
          >
            <span className="flex items-center gap-2">
              <Star size={12} className="text-[#f39c12]" />
              Minimum Puan
            </span>
            {showRatingFilter ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
          {showRatingFilter && (
            <div className="flex flex-wrap gap-1.5">
              {[null, 5, 6, 7, 8, 9].map((puan) => (
                <button
                  key={puan ?? "all"}
                  onClick={() => onMinPuanChange(puan)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    minPuan === puan
                      ? "bg-[#f39c12]/20 text-[#f39c12] border border-[#f39c12]/30"
                      : "bg-white/5 text-[#8E8E93] border border-transparent hover:bg-white/10"
                  }`}
                >
                  {puan ? `${puan}+` : "Tümü"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Uygula Butonu */}
        {activeFilterCount > 0 && (
          <button
            onClick={onApply}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white font-semibold text-sm hover:shadow-lg hover:shadow-[#6C5CE7]/25 transition-all"
          >
            Filtreleri Uygula
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// EXTERNAL API CARD (TMDB / Google Books)
// ============================================

interface ExternalCardProps {
  item: TmdbFilm | GoogleBook;
  type: "film" | "kitap" | "tv";
  onImport: () => void;
  importing?: boolean;
  dbId?: number; // Veritabanından gelen içerik için ID
  onNavigate?: (id: number) => void; // Veritabanı içeriğine tıklama
}

function ExternalCard({
  item,
  type,
  onImport,
  importing,
  dbId,
  onNavigate,
}: ExternalCardProps) {
  const isTmdb = type === "film" || type === "tv";
  const film = item as TmdbFilm;
  const book = item as GoogleBook;

  // Veritabanından gelen içerik mi?
  const isDbItem = dbId !== undefined;

  // Backend Türkçe alan adları kullanıyor (posterUrl, baslik, puan)
  // HTTP URL'leri HTTPS'e çevir
  let posterUrl: string | undefined;
  if (isTmdb) {
    // Backend posterUrl tam URL döndürüyor, posterPath ise sadece path
    posterUrl =
      film.posterUrl ||
      (film.posterPath
        ? `https://image.tmdb.org/t/p/w300${film.posterPath}`
        : undefined);
  } else {
    const rawUrl = book.posterUrl || book.thumbnail;
    posterUrl = rawUrl?.replace("http://", "https://");
  }

  const title = isTmdb ? film.baslik || film.title : book.baslik || book.title;
  const rating = isTmdb
    ? film.puan || film.voteAverage
    : book.ortalamaPuan || book.averageRating;
  const year = isTmdb
    ? (film.yayinTarihi || film.releaseDate)?.split("-")[0]
    : (book.yayinTarihi || book.publishedDate)?.split("-")[0];

  // Media type belirleme
  const mediaType = isTmdb ? film.mediaType || type : "kitap";
  const displayType =
    mediaType === "tv"
      ? "Dizi"
      : mediaType === "movie"
      ? "Film"
      : type === "kitap"
      ? "Kitap"
      : "Film";

  return (
    <div
      className={`group ${isDbItem ? "cursor-pointer" : ""}`}
      onClick={
        isDbItem && dbId && onNavigate ? () => onNavigate(dbId) : undefined
      }
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-white/5">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {type === "tv" ? (
              <Tv size={40} className="text-[#8E8E93]" />
            ) : type === "film" ? (
              <Film size={40} className="text-[#8E8E93]" />
            ) : (
              <BookOpen size={40} className="text-[#8E8E93]" />
            )}
          </div>
        )}
        {rating !== undefined && rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#6C5CE7]/20 backdrop-blur-md px-1.5 py-0.5 rounded-md">
            <Star size={10} className="text-[#6C5CE7] fill-[#6C5CE7]" />
            <span className="text-xs text-white font-semibold">
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Media type badge */}
        {isTmdb && mediaType === "tv" && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#00CEC9]/80 text-white text-xs font-medium">
            Dizi
          </div>
        )}
        {/* Import overlay - sadece harici içerikler için */}
        {!isDbItem && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <NebulaButton
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onImport();
              }}
              disabled={importing}
            >
              {importing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Ekle"
              )}
            </NebulaButton>
          </div>
        )}
      </div>
      <h3 className="font-medium text-white text-sm line-clamp-2">{title}</h3>
      <div className="flex items-center gap-2 mt-1">
        {type === "tv" ? (
          <Tv size={12} className="text-[#00CEC9]" />
        ) : type === "film" ? (
          <Film size={12} className="text-[#6C5CE7]" />
        ) : (
          <BookOpen size={12} className="text-[#8E8E93]" />
        )}
        <span className="text-xs text-[#8E8E93]">{displayType}</span>
        {year && <span className="text-xs text-[#8E8E93]">• {year}</span>}
      </div>
    </div>
  );
}

// ============================================
// CONTENT GRID SKELETON
// ============================================

function ContentSkeleton() {
  return (
    <div>
      <div className="aspect-[2/3] rounded-xl skeleton mb-2" />
      <div className="h-4 w-full skeleton rounded mb-1" />
      <div className="h-3 w-20 skeleton rounded" />
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// HTML taglarını temizleyen yardımcı fonksiyon
// Google Books API bazen <b>, <p>, <i> gibi HTML tagları döndürüyor
function stripHtmlTags(html: string | undefined | null): string {
  if (!html) return "";
  // <br> ve </p> taglarını satır sonuna çevir (paragraf geçişleri için)
  let text = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n");
  // Diğer HTML taglarını kaldır
  text = text.replace(/<[^>]*>/g, "");
  // HTML entities'i decode et
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  // Birden fazla satır sonunu tek satır sonuna çevir
  text = text.replace(/\n{3,}/g, "\n\n");
  // Satır başı/sonu boşlukları temizle
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
  return text;
}

// Yayın tarihini yıla çeviren yardımcı fonksiyon
// "2023", "2023-05", "2023-05-15" formatlarını destekler
function parseYearFromDate(dateStr: string | undefined): number {
  if (!dateStr) return 0;

  const yearMatch = dateStr.match(/^(\d{4})/);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10);
  }
  return 0;
}

// ============================================
// MAIN EXPLORE PAGE
// ============================================

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL'den state'leri oku (sayfa geri dönüşünde korunması için)
  const initialTab = (searchParams.get("tab") as "tmdb" | "kitaplar") || "tmdb";
  const initialQuery = searchParams.get("q") || "";
  const initialTmdbFilter =
    (searchParams.get("tmdbFilter") as "all" | "movie" | "tv") || "all";
  const initialTmdbSort =
    (searchParams.get("tmdbSort") as
      | "popular"
      | "top_rated"
      | "trending"
      | "now_playing") || "popular";
  const initialBookLang = searchParams.get("bookLang") || "";
  const initialBookCategory = searchParams.get("bookCategory") || "all";
  const initialMinYear = searchParams.get("minYear")
    ? parseInt(searchParams.get("minYear")!)
    : null;
  const initialMaxYear = searchParams.get("maxYear")
    ? parseInt(searchParams.get("maxYear")!)
    : null;
  const initialMinPuan = searchParams.get("minPuan")
    ? parseInt(searchParams.get("minPuan")!)
    : null;

  // States
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"tmdb" | "kitaplar">(initialTab);

  // TMDB filters
  const [tmdbFilter, setTmdbFilter] = useState<"all" | "movie" | "tv">(
    initialTmdbFilter
  );
  const [tmdbSort, setTmdbSort] = useState<
    "popular" | "top_rated" | "trending" | "now_playing"
  >(initialTmdbSort);
  const [tmdbPage, setTmdbPage] = useState(1);
  const [tmdbHasMore, setTmdbHasMore] = useState(true);
  const [tmdbLoadingMore, setTmdbLoadingMore] = useState(false);
  const tmdbLoadingRef = useRef(false);

  // Kitap filters
  const [bookLang, setBookLang] = useState<string>(initialBookLang);
  const [bookStartIndex, setBookStartIndex] = useState(0);
  const [bookHasMore, setBookHasMore] = useState(true);
  const [bookLoadingMore, setBookLoadingMore] = useState(false);
  const [bookDataLoaded, setBookDataLoaded] = useState(false);

  // Arama için ayrı state'ler (infinite scroll)
  const [searchStartIndex, setSearchStartIndex] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(true);
  const searchSeenIds = useRef(new Set<string>());

  // Dil seçenekleri - Sadece güvenilir çalışan diller
  // Google Books API'nin langRestrict parametresi bazı dillerde hatalı sonuç veriyor
  const bookLanguages = [
    { value: "", label: "🌍 Tüm Diller" },
    { value: "tr", label: "🇹🇷 Türkçe" },
    { value: "en", label: "🇬🇧 İngilizce" },
  ];

  // Görüntülenen kitap ID'lerini takip et (güçlü duplicate kontrolü)
  const seenBookIds = useRef(new Set<string>());
  // Son istenen startIndex ve queryIndex'i takip et (duplicate request önleme)
  const lastRequestedKey = useRef<string>("");

  // ============================================
  // GOOGLE BOOKS API STRATEJİSİ - JSON CONFIG
  // ============================================
  // Sorgular bookQueries.json dosyasından okunuyor
  const turkishPublishers = bookQueriesConfig.turkishPublishers;
  const turkishAuthorQueries = bookQueriesConfig.turkishAuthors;
  const internationalPublishers = bookQueriesConfig.internationalPublishers;
  const universalGenreQueries = bookQueriesConfig.universalGenres;

  // Aktif sorgu listesi - dil seçimine göre (useMemo ile cache'le)
  const allCategoryQueries = useMemo(() => {
    if (bookLang === "tr") {
      return [
        ...turkishPublishers,
        ...turkishAuthorQueries,
        ...universalGenreQueries,
      ];
    }
    if (bookLang === "en") {
      return [...internationalPublishers, ...universalGenreQueries];
    }
    // Tüm diller - TR ve EN sorgularını karışık (interleaved) sırala
    // Böylece hem Türkçe hem İngilizce kitaplar dengeli gelir
    const trQueries = [...turkishPublishers, ...turkishAuthorQueries];
    const enQueries = [...internationalPublishers, ...universalGenreQueries];
    const interleaved: string[] = [];
    const maxLen = Math.max(trQueries.length, enQueries.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < trQueries.length) interleaved.push(trQueries[i]);
      if (i < enQueries.length) interleaved.push(enQueries[i]);
    }
    return interleaved;
  }, [
    bookLang,
    turkishPublishers,
    turkishAuthorQueries,
    internationalPublishers,
    universalGenreQueries,
  ]);
  const [allQueryIndex, setAllQueryIndex] = useState(0);

  // Kitap kategori filtreleri - JSON'dan oku
  const bookCategories = Object.entries(bookQueriesConfig.categories).map(
    ([value, data]) => ({
      value,
      label: data.labelTr,
      queryEn: data.queryEn,
      queryTr: data.queryTr,
    })
  );
  const [bookCategory, setBookCategory] = useState(initialBookCategory);

  // Advanced filter states
  const [minYear, setMinYear] = useState<number | null>(initialMinYear);
  const [maxYear, setMaxYear] = useState<number | null>(initialMaxYear);
  const [minPuan, setMinPuan] = useState<number | null>(initialMinPuan);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [appliedFilters, setAppliedFilters] = useState({
    minYear: initialMinYear,
    maxYear: initialMaxYear,
    minPuan: initialMinPuan,
    genres: [] as number[],
  });

  // Session storage'dan cache'lenmiş sonuçları oku
  const getCachedResults = () => {
    try {
      const cached = sessionStorage.getItem("explorePageCache");
      if (cached) {
        const data = JSON.parse(cached);
        // Cache key kontrolü - aynı filtrelerle mi?
        const currentKey = `${activeTab}-${bookLang}-${bookCategory}-${initialMinYear}-${initialMaxYear}-${initialMinPuan}`;
        if (data.key === currentKey) {
          return data;
        }
      }
    } catch (e) {
      console.error("Cache okuma hatası:", e);
    }
    return null;
  };

  const cachedData = getCachedResults();

  // Data states - cache'den veya boş başlat
  const [tmdbResults, setTmdbResults] = useState<TmdbFilm[]>(
    cachedData?.tmdbResults || []
  );
  const [bookResults, setBookResults] = useState<GoogleBook[]>(
    cachedData?.bookResults || []
  );

  // Cache'den veri geldiyse başlangıç değerlerini ayarla
  const hasCache =
    cachedData !== null &&
    (cachedData.bookResults?.length > 0 || cachedData.tmdbResults?.length > 0);

  // Cache'den gelen scroll pozisyonunu kullan
  useEffect(() => {
    if (cachedData?.scrollY) {
      setTimeout(() => {
        window.scrollTo(0, cachedData.scrollY);
      }, 100);
    }
  }, []); // Sadece mount'ta çalış

  // Sonuçları cache'le (sayfa terk edilirken)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const cacheKey = `${activeTab}-${bookLang}-${bookCategory}-${appliedFilters.minYear}-${appliedFilters.maxYear}-${appliedFilters.minPuan}`;
      const cacheData = {
        key: cacheKey,
        tmdbResults,
        bookResults,
        bookStartIndex,
        scrollY: window.scrollY,
        timestamp: Date.now(),
      };
      sessionStorage.setItem("explorePageCache", JSON.stringify(cacheData));
    };

    // Sayfa terk edilirken veya navigate edilirken cache'le
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Component unmount olurken cache'le (navigate için)
      handleBeforeUnload();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    activeTab,
    bookLang,
    bookCategory,
    appliedFilters,
    tmdbResults,
    bookResults,
    bookStartIndex,
  ]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  // Filter helper - filtre uygulama (hem TMDB hem Kitaplar için)
  const applyFilters = () => {
    // Filtreler değişmediyse hiçbir şey yapma
    const filtersChanged =
      appliedFilters.minYear !== minYear ||
      appliedFilters.maxYear !== maxYear ||
      appliedFilters.minPuan !== minPuan ||
      JSON.stringify(appliedFilters.genres) !== JSON.stringify(selectedGenres);

    if (!filtersChanged) {
      console.log("📋 Filtreler değişmedi, işlem atlanıyor");
      return;
    }

    setAppliedFilters({ minYear, maxYear, minPuan, genres: selectedGenres });
    // TMDB için
    setTmdbPage(1);
    setTmdbResults([]);
    setTmdbHasMore(true);
    // Kitaplar için
    setBookStartIndex(0);
    setAllQueryIndex(0);
    setBookResults([]);
    seenBookIds.current.clear();
    lastRequestedKey.current = ""; // Cache key'i sıfırla
    setBookHasMore(true);
    setBookDataLoaded(false);
  };

  const resetFilters = () => {
    setMinYear(null);
    setMaxYear(null);
    setMinPuan(null);
    setSelectedGenres([]);
    setAppliedFilters({
      minYear: null,
      maxYear: null,
      minPuan: null,
      genres: [],
    });
    // TMDB için
    setTmdbPage(1);
    setTmdbResults([]);
    setTmdbHasMore(true);
    // Kitaplar için
    setBookStartIndex(0);
    setAllQueryIndex(0);
    setBookResults([]);
    seenBookIds.current.clear();
    setBookHasMore(true);
    setBookDataLoaded(false);
  };

  // TMDB filter/sort değiştiğinde state'leri sıfırla
  const handleTmdbFilterChange = (filter: "all" | "movie" | "tv") => {
    if (filter === tmdbFilter) return;
    setTmdbFilter(filter);
    setTmdbPage(1);
    setTmdbResults([]);
    setTmdbHasMore(true);
  };

  const handleTmdbSortChange = (
    sort: "popular" | "top_rated" | "trending" | "now_playing"
  ) => {
    if (sort === tmdbSort) return;
    setTmdbSort(sort);
    setTmdbPage(1);
    setTmdbResults([]);
    setTmdbHasMore(true);
  };

  // Kitap kategori değiştiğinde state'leri sıfırla
  const handleBookCategoryChange = (category: string) => {
    if (category === bookCategory) return;
    setBookCategory(category);
    setBookStartIndex(0);
    setAllQueryIndex(0); // Harf/kelime rotasyonunu sıfırla
    setBookResults([]);
    seenBookIds.current.clear(); // Görüntülenen ID'leri temizle
    lastRequestedKey.current = ""; // Request tracker'ı sıfırla
    setBookHasMore(true);
    setBookDataLoaded(false);
  };

  // Kitap dil değiştiğinde state'leri sıfırla
  const handleBookLangChange = (lang: string) => {
    if (lang === bookLang) return;
    setBookLang(lang);
    setBookStartIndex(0);
    setAllQueryIndex(0);
    setBookResults([]);
    seenBookIds.current.clear();
    lastRequestedKey.current = ""; // Request tracker'ı sıfırla
    setBookHasMore(true);
    setBookDataLoaded(false);
  };

  // Puan filtresi değiştiğinde - "Tümü" seçilirse hemen uygula
  const handleMinPuanChange = (puan: number | null) => {
    setMinPuan(puan);

    // "Tümü" (null) seçildiğinde hemen filtreyi kaldır ve verileri yeniden yükle
    if (puan === null && appliedFilters.minPuan !== null) {
      setAppliedFilters((prev) => ({ ...prev, minPuan: null }));
      // Kitaplar için state'leri sıfırla
      setBookStartIndex(0);
      setAllQueryIndex(0);
      setBookResults([]);
      seenBookIds.current.clear();
      lastRequestedKey.current = "";
      setBookHasMore(true);
      setBookDataLoaded(false);
    }
  };

  // Rate limit retry sayacı (maksimum 3 deneme)
  const rateLimitRetryCount = useRef(0);
  const MAX_RATE_LIMIT_RETRIES = 3;

  // TMDB verilerini yükle - useRef ile fonksiyon referansını sabit tut
  const tmdbParamsRef = useRef({
    tmdbFilter,
    tmdbSort,
    appliedFilters,
    searchQuery,
  });
  tmdbParamsRef.current = { tmdbFilter, tmdbSort, appliedFilters, searchQuery };

  const tmdbResultsRef = useRef<TmdbFilm[]>([]);
  tmdbResultsRef.current = tmdbResults;

  // Arama fonksiyonu - ilk sayfa için
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      // Arama temizlendiğinde normal keşfet moduna dön
      setSearchStartIndex(0);
      setSearchHasMore(true);
      searchSeenIds.current.clear();

      // Kitaplar sekmesindeyse keşfet verilerini yeniden yükle
      if (activeTab === "kitaplar") {
        setBookResults([]);
        seenBookIds.current.clear();
        setBookStartIndex(0);
        setAllQueryIndex(0);
        setBookDataLoaded(false); // Bu sayede loadBooksData tetiklenecek
        lastRequestedKey.current = "";
      }
      // TMDB sekmesindeyse tmdb verilerini yeniden yükle
      if (activeTab === "tmdb") {
        setTmdbResults([]);
        setTmdbPage(1);
        tmdbDataLoadedRef.current = false;
      }
      return;
    }

    // Arama değiştiğinde state'leri sıfırla
    setSearchStartIndex(0);
    setSearchHasMore(true);
    searchSeenIds.current.clear();
    setLoading(true);

    try {
      if (activeTab === "tmdb") {
        let results: TmdbFilm[];
        if (tmdbFilter === "movie") {
          results = await externalApi.searchTmdb(searchQuery);
        } else if (tmdbFilter === "tv") {
          results = await externalApi.searchTmdbTv(searchQuery);
        } else {
          results = await externalApi.searchTmdbMulti(searchQuery);
        }
        setTmdbResults(results);
      } else if (activeTab === "kitaplar") {
        // API'ye her zaman relevance gönder
        const langParam = bookLang || undefined;
        const response = await externalApi.searchBooks(
          searchQuery,
          0,
          40,
          "relevance",
          langParam
        );
        let results = response.items || [];

        // HTML taglarını tüm açıklamalardan temizle
        results = results.map((book: GoogleBook) => ({
          ...book,
          aciklama: stripHtmlTags(book.aciklama),
          description: stripHtmlTags(book.description),
        }));

        // Kalite filtresi - kapağı olmayanları çıkar
        results = results.filter((book: GoogleBook) => {
          const hasCover = book.posterUrl || book.thumbnail;
          if (!hasCover) return false;
          const title = book.baslik || book.title;
          if (!title || title.trim().length < 2) return false;
          return true;
        });

        // CLIENT-SIDE DİL FİLTRELEMESİ (arama için de)
        if (bookLang) {
          results = results.filter((book: GoogleBook) => {
            const bookLanguage = book.dil || book.language || "";
            return bookLanguage === bookLang;
          });
        }

        // Yıl filtresi uygula (appliedFilters)
        // Aralıktaki kitaplar + tarihi bilinmeyenler gösterilsin, aralık dışındakiler çıkarılsın
        if (appliedFilters.minYear || appliedFilters.maxYear) {
          const minY = appliedFilters.minYear
            ? parseInt(String(appliedFilters.minYear), 10)
            : 0;
          const maxY = appliedFilters.maxYear
            ? parseInt(String(appliedFilters.maxYear), 10)
            : 9999;

          console.log(`📅 Yıl filtresi: ${minY} - ${maxY}`);

          const inRange: GoogleBook[] = [];
          const noDate: GoogleBook[] = [];

          results.forEach((book: GoogleBook) => {
            const year = parseYearFromDate(
              book.yayinTarihi || book.publishedDate
            );
            console.log(`  - "${book.baslik || book.title}": yıl=${year}`);
            if (year === 0) {
              noDate.push(book); // Tarihi bilinmeyenler en sona
            } else if (year >= minY && year <= maxY) {
              inRange.push(book); // Aralıktakiler
            }
            // Aralık dışındakiler çıkarılıyor (dahil edilmiyor)
          });

          console.log(
            `  ✅ Aralıkta: ${inRange.length}, Tarihsiz: ${noDate.length}`
          );

          // Önce aralıktakiler, sonra tarihi bilinmeyenler
          results = [...inRange, ...noDate];
        }

        // Puan filtresi uygula (kitaplar için ortalamaPuan/averageRating)
        if (appliedFilters.minPuan) {
          results = results.filter((book: GoogleBook) => {
            const rating = book.ortalamaPuan || book.averageRating || 0;
            // Google Books 5 üzerinden, biz 10 üzerinden gösteriyoruz
            const rating10 = rating * 2;
            return rating10 >= appliedFilters.minPuan!;
          });
        }

        // Duplicate kontrolü
        results = results.filter((book: GoogleBook) => {
          if (searchSeenIds.current.has(book.id)) return false;
          searchSeenIds.current.add(book.id);
          return true;
        });

        setBookResults(results);
        // API'den sonuç geldiyse ve limit (1000) aşılmadıysa devam et
        // Google Books API maksimum startIndex=1000 destekler
        setSearchHasMore(true); // İlk sayfada her zaman devam et
      }
    } catch (err) {
      console.error("Arama hatası:", err);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    activeTab,
    tmdbFilter,
    appliedFilters.minYear,
    appliedFilters.maxYear,
  ]);

  // Arama için daha fazla sonuç yükle (infinite scroll)
  const loadMoreSearchResults = useCallback(async () => {
    if (!searchQuery.trim() || !searchHasMore || bookLoadingMore) return;

    const newStartIndex = searchStartIndex + 40;
    setBookLoadingMore(true);

    try {
      const langParam = bookLang || undefined;
      const response = await externalApi.searchBooks(
        searchQuery,
        newStartIndex,
        40,
        "relevance",
        langParam
      );
      let results = response.items || [];

      // HTML taglarını temizle
      results = results.map((book: GoogleBook) => ({
        ...book,
        aciklama: stripHtmlTags(book.aciklama),
        description: stripHtmlTags(book.description),
      }));

      // Kalite filtresi
      results = results.filter((book: GoogleBook) => {
        const hasCover = book.posterUrl || book.thumbnail;
        if (!hasCover) return false;
        const title = book.baslik || book.title;
        if (!title || title.trim().length < 2) return false;
        return true;
      });

      // CLIENT-SIDE DİL FİLTRELEMESİ
      if (bookLang) {
        results = results.filter((book: GoogleBook) => {
          const bookLanguage = book.dil || book.language || "";
          return bookLanguage === bookLang;
        });
      }

      // Yıl filtresi uygula (appliedFilters)
      // Aralıktaki kitaplar + tarihi bilinmeyenler gösterilsin, aralık dışındakiler çıkarılsın
      if (appliedFilters.minYear || appliedFilters.maxYear) {
        const minY = appliedFilters.minYear
          ? parseInt(String(appliedFilters.minYear), 10)
          : 0;
        const maxY = appliedFilters.maxYear
          ? parseInt(String(appliedFilters.maxYear), 10)
          : 9999;

        const inRange: GoogleBook[] = [];
        const noDate: GoogleBook[] = [];

        results.forEach((book: GoogleBook) => {
          const year = parseYearFromDate(
            book.yayinTarihi || book.publishedDate
          );
          if (year === 0) {
            noDate.push(book);
          } else if (year >= minY && year <= maxY) {
            inRange.push(book);
          }
        });

        results = [...inRange, ...noDate];
      }

      // Puan filtresi uygula
      if (appliedFilters.minPuan) {
        results = results.filter((book: GoogleBook) => {
          const rating = book.ortalamaPuan || book.averageRating || 0;
          const rating10 = rating * 2;
          return rating10 >= appliedFilters.minPuan!;
        });
      }

      // Duplicate kontrolü
      const uniqueResults = results.filter((book: GoogleBook) => {
        if (searchSeenIds.current.has(book.id)) return false;
        searchSeenIds.current.add(book.id);
        return true;
      });

      if (uniqueResults.length > 0) {
        // Yeni sonuçları ekle
        setBookResults((prev) => {
          // Ek duplicate kontrolü - prev'de zaten varsa ekleme
          const existingIds = new Set(prev.map((b) => b.id));
          const trulyUnique = uniqueResults.filter(
            (b) => !existingIds.has(b.id)
          );
          if (trulyUnique.length === 0) return prev; // Değişiklik yoksa aynı referansı döndür

          return [...prev, ...trulyUnique];
        });
        setSearchStartIndex(newStartIndex);
      }

      // API'den hiç sonuç gelmediyse veya startIndex 960'ı geçtiyse (API limiti 1000) dur
      // response.items boş geldiyse artık sonuç yok demektir
      const apiHasMore = results.length > 0 && newStartIndex < 960;
      setSearchHasMore(apiHasMore);

      console.log(
        `🔍 Arama: startIndex=${newStartIndex}, sonuç=${results.length}, unique=${uniqueResults.length}, hasMore=${apiHasMore}`
      );
    } catch (err) {
      console.error("Daha fazla arama sonucu yükleme hatası:", err);
      setSearchHasMore(false);
    } finally {
      setBookLoadingMore(false);
    }
  }, [
    searchQuery,
    searchStartIndex,
    searchHasMore,
    bookLoadingMore,
    bookLang,
    appliedFilters.minYear,
    appliedFilters.maxYear,
    appliedFilters.minPuan,
  ]);

  // TMDB verileri yükle (tab, filtre, sort veya sayfa değişince)
  const tmdbDataLoadedRef = useRef(false);

  // Filter/sort değişince reset
  useEffect(() => {
    tmdbDataLoadedRef.current = false;
  }, [tmdbFilter, tmdbSort, appliedFilters]);

  useEffect(() => {
    if (activeTab !== "tmdb") return;
    if (searchQuery.trim().length >= 2) return; // Arama varsa bu effect çalışmaz

    // Zaten yükleme yapılıyorsa atla
    if (tmdbLoadingRef.current) return;

    const isFirstPage = tmdbPage === 1;

    // Cache'den veri geldiyse ve ilk sayfaysa tekrar yükleme
    if (isFirstPage && hasCache && tmdbResults.length > 0) {
      console.log(
        "🎬 Cache'den TMDB verisi kullanılıyor, API çağrısı atlanıyor"
      );
      tmdbDataLoadedRef.current = true;
      return;
    }

    // SADECE ilk sayfa için: zaten yüklüyse atla
    if (
      isFirstPage &&
      tmdbDataLoadedRef.current &&
      tmdbResultsRef.current.length > 0
    )
      return;

    const loadData = async () => {
      const currentResults = tmdbResultsRef.current;
      const {
        tmdbFilter: filter,
        tmdbSort: sort,
        appliedFilters: filters,
      } = tmdbParamsRef.current;

      tmdbLoadingRef.current = true;
      if (isFirstPage) {
        setLoading(true);
      } else {
        setTmdbLoadingMore(true);
      }

      try {
        let results: TmdbFilm[] = [];

        if (sort === "popular") {
          if (filter === "movie") {
            results = await externalApi.getTmdbPopular(tmdbPage);
          } else if (filter === "tv") {
            results = await externalApi.getTmdbPopularTv(tmdbPage);
          } else {
            const [movies, tv] = await Promise.all([
              externalApi.getTmdbPopular(tmdbPage),
              externalApi.getTmdbPopularTv(tmdbPage),
            ]);
            results = [...movies, ...tv].sort(
              (a, b) => (b.puan || 0) - (a.puan || 0)
            );
          }
        } else if (sort === "top_rated") {
          if (filter === "movie") {
            results = await externalApi.getTmdbTopRated(tmdbPage);
          } else if (filter === "tv") {
            results = await externalApi.getTmdbTopRatedTv(tmdbPage);
          } else {
            const [movies, tv] = await Promise.all([
              externalApi.getTmdbTopRated(tmdbPage),
              externalApi.getTmdbTopRatedTv(tmdbPage),
            ]);
            results = [...movies, ...tv].sort(
              (a, b) => (b.puan || 0) - (a.puan || 0)
            );
          }
        } else if (sort === "trending") {
          const mediaType =
            filter === "movie" ? "movie" : filter === "tv" ? "tv" : "all";
          results = await externalApi.getTmdbTrending(
            mediaType,
            "week",
            tmdbPage
          );
        } else if (sort === "now_playing") {
          if (filter === "movie") {
            results = await externalApi.getTmdbNowPlaying(tmdbPage);
          } else if (filter === "tv") {
            results = await externalApi.getTmdbOnTheAir(tmdbPage);
          } else {
            const [movies, tv] = await Promise.all([
              externalApi.getTmdbNowPlaying(tmdbPage),
              externalApi.getTmdbOnTheAir(tmdbPage),
            ]);
            results = [...movies, ...tv];
          }
        }

        // Filtreleri uygula (yıl, puan ve tür)
        if (
          filters.minYear ||
          filters.maxYear ||
          filters.minPuan ||
          filters.genres.length > 0
        ) {
          // Seçilen türler için tüm eşleşen ID'leri topla (film ve dizi için)
          const expandedGenreIds = new Set<number>();
          filters.genres.forEach((genreId) => {
            const mappedIds = GENRE_MAPPING[genreId] || [genreId];
            mappedIds.forEach((id) => expandedGenreIds.add(id));
          });

          results = results.filter((item) => {
            const year = item.yayinTarihi
              ? parseInt(item.yayinTarihi.split("-")[0])
              : null;
            if (filters.minYear && (!year || year < filters.minYear))
              return false;
            if (filters.maxYear && (!year || year > filters.maxYear))
              return false;
            if (filters.minPuan && (!item.puan || item.puan < filters.minPuan))
              return false;
            if (filters.genres.length > 0) {
              const itemGenres = item.turIds || [];
              // İçeriğin türlerinden herhangi biri genişletilmiş tür listesinde var mı?
              const hasMatchingGenre = itemGenres.some((itemGenreId) =>
                expandedGenreIds.has(itemGenreId)
              );
              if (!hasMatchingGenre) return false;
            }
            return true;
          });
        }

        // Duplicate'leri filtrele (aynı ID + mediaType kombinasyonu)
        const existingIds = new Set(
          currentResults.map((r) => `${r.mediaType}-${r.id}`)
        );
        const uniqueNewResults = results.filter(
          (r) => !existingIds.has(`${r.mediaType}-${r.id}`)
        );

        const merged = isFirstPage
          ? results
          : [...currentResults, ...uniqueNewResults];
        setTmdbResults(merged);

        // TMDB genelde sayfa başına 20 sonuç döndürür
        // API'den sonuç geldiyse daha fazla veri var demektir
        setTmdbHasMore(results.length > 0);

        if (isFirstPage) {
          tmdbDataLoadedRef.current = true;
        }
      } catch (err) {
        console.error("TMDB veri yükleme hatası:", err);
      } finally {
        if (isFirstPage) {
          setLoading(false);
        } else {
          setTmdbLoadingMore(false);
        }
        tmdbLoadingRef.current = false;
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tmdbFilter, tmdbSort, tmdbPage, appliedFilters, searchQuery]);

  // Scroll state'lerini ref'te tut (stale closure önleme)
  const tmdbScrollStateRef = useRef({
    loading: false,
    tmdbLoadingMore: false,
    tmdbHasMore: true,
  });
  tmdbScrollStateRef.current = { loading, tmdbLoadingMore, tmdbHasMore };

  // Scroll ile TMDB için sonsuz kaydırma (throttled)
  const tmdbScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  useEffect(() => {
    if (activeTab !== "tmdb") return;

    const handleScroll = () => {
      const {
        loading: isLoading,
        tmdbLoadingMore: isLoadingMore,
        tmdbHasMore: hasMore,
      } = tmdbScrollStateRef.current;

      // Yükleme yapılıyorsa veya daha fazla veri yoksa atla
      if (isLoading || isLoadingMore || !hasMore || tmdbLoadingRef.current)
        return;
      if (tmdbScrollTimeoutRef.current) return; // Throttle: bekleyen timeout varsa atla

      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.body.offsetHeight - 400;
      if (scrollPosition >= threshold) {
        tmdbScrollTimeoutRef.current = setTimeout(() => {
          setTmdbPage((prev) => prev + 1);
          tmdbScrollTimeoutRef.current = null;
        }, 300);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (tmdbScrollTimeoutRef.current) {
        clearTimeout(tmdbScrollTimeoutRef.current);
      }
    };
  }, [activeTab]); // Sadece tab değişince re-attach

  // Scroll ile Kitaplar için sonsuz kaydırma (throttled)
  const bookScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const bookScrollStateRef = useRef({
    loading: false,
    bookLoadingMore: false,
    bookHasMore: true,
    bookDataLoaded: false,
    searchQuery: "",
    searchHasMore: true,
  });
  bookScrollStateRef.current = {
    loading,
    bookLoadingMore,
    bookHasMore,
    bookDataLoaded,
    searchQuery,
    searchHasMore,
  };

  // loadMoreSearchResults'ı ref'te tut (stale closure önleme)
  const loadMoreSearchResultsRef = useRef(loadMoreSearchResults);
  loadMoreSearchResultsRef.current = loadMoreSearchResults;

  useEffect(() => {
    if (activeTab !== "kitaplar") return;

    const handleScroll = () => {
      const {
        loading: isLoading,
        bookLoadingMore: isLoadingMore,
        bookHasMore: hasMore,
        bookDataLoaded: dataLoaded,
        searchQuery: query,
        searchHasMore: searchMore,
      } = bookScrollStateRef.current;

      // Yükleme yapılıyorsa atla
      if (isLoading || isLoadingMore) return;
      if (bookScrollTimeoutRef.current) return; // Throttle: bekleyen istek varsa atla

      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.body.offsetHeight - 600; // Daha erken tetikle

      if (scrollPosition >= threshold) {
        bookScrollTimeoutRef.current = setTimeout(() => {
          // Arama varsa loadMoreSearchResults kullan
          if (query.trim().length >= 2) {
            if (searchMore) {
              loadMoreSearchResultsRef.current();
            }
          } else {
            // Keşfet modu - daha fazla veri yoksa veya ilk yükleme bitmemişse atla
            if (!hasMore || !dataLoaded) {
              bookScrollTimeoutRef.current = null;
              return;
            }
            setBookStartIndex((prev) => prev + 40);
          }
          bookScrollTimeoutRef.current = null;
        }, 300);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (bookScrollTimeoutRef.current) {
        clearTimeout(bookScrollTimeoutRef.current);
      }
    };
  }, [activeTab]); // Sadece tab değişince re-attach - state'ler ref ile takip ediliyor

  // Kitaplar için varsayılan veri yükle (tab değişince veya kategori/sıralama değişince)
  useEffect(() => {
    const loadBooksData = async () => {
      if (activeTab !== "kitaplar") return;

      // Arama varsa zaten handleSearch çalışacak
      if (searchQuery.trim().length >= 2) return;

      // ============================================
      // PUAN FİLTRESİ AKTİFSE VERİTABANINDAN ÇEK
      // ============================================
      if (appliedFilters.minPuan) {
        // İlk sayfa kontrolü
        const isFirstDbPage = bookStartIndex === 0;

        // Cache'den veri geldiyse ve ilk sayfaysa tekrar yükleme
        if (isFirstDbPage && hasCache && bookResults.length > 0) {
          console.log(
            "📚 Puan filtresi: Cache'den veri kullanılıyor, API çağrısı atlanıyor"
          );
          setBookDataLoaded(true);
          return;
        }

        if (isFirstDbPage) {
          setLoading(true);
          seenBookIds.current.clear();
        } else {
          setBookLoadingMore(true);
        }

        try {
          const sayfa = Math.floor(bookStartIndex / 40) + 1;
          console.log(
            `📚 Veritabanından puanlı kitaplar çekiliyor: minPuan=${appliedFilters.minPuan}, sayfa=${sayfa}`
          );

          const response = await icerikApi.filtrele({
            tur: "kitap",
            minPuan: appliedFilters.minPuan,
            sayfa,
            limit: 40,
          });

          // Veritabanı sonuçlarını GoogleBook formatına çevir
          // Puanlar zaten 10 üzerinden, dönüşüm yapmıyoruz
          const dbResults: GoogleBook[] = response.data.map((item) => ({
            id: `db-${item.id}`,
            baslik: item.baslik,
            title: item.baslik,
            yazarlar: [],
            authors: [],
            aciklama: item.aciklama || "",
            description: item.aciklama || "",
            posterUrl: item.posterUrl || "",
            thumbnail: item.posterUrl || "",
            yayinTarihi: item.yayinTarihi?.toString().slice(0, 10) || "",
            publishedDate: item.yayinTarihi?.toString().slice(0, 10) || "",
            ortalamaPuan: item.ortalamaPuan
              ? Number(item.ortalamaPuan)
              : undefined,
            averageRating: item.ortalamaPuan
              ? Number(item.ortalamaPuan)
              : undefined,
            dil: "tr",
            language: "tr",
          }));

          // Duplicate kontrolü
          const uniqueResults = dbResults.filter((book: GoogleBook) => {
            if (seenBookIds.current.has(book.id)) return false;
            seenBookIds.current.add(book.id);
            return true;
          });

          if (isFirstDbPage) {
            setBookResults(uniqueResults);
          } else {
            setBookResults((prev) => [...prev, ...uniqueResults]);
          }

          setBookHasMore(response.toplamSayfa > sayfa);
          setBookDataLoaded(true);

          console.log(
            `📚 Veritabanından ${uniqueResults.length} kitap geldi, toplam sayfa: ${response.toplamSayfa}`
          );
        } catch (err) {
          console.error("Veritabanı kitap yükleme hatası:", err);
          setBookHasMore(false);
        } finally {
          setLoading(false);
          setBookLoadingMore(false);
        }

        return; // Veritabanından çektik, Google Books API'yi çağırma
      }

      // ============================================
      // PUAN FİLTRESİ YOKSA GOOGLE BOOKS API
      // ============================================

      // İlk sayfa kontrolü
      const isFirstPage = bookStartIndex === 0 && allQueryIndex === 0;

      // Cache'den veri geldiyse ve ilk sayfaysa tekrar yükleme
      if (isFirstPage && hasCache && bookResults.length > 0) {
        console.log("📚 Cache'den veri kullanılıyor, API çağrısı atlanıyor");
        setBookDataLoaded(true);
        return;
      }

      // Duplicate request kontrolü - aynı startIndex+queryIndex kombinasyonu için tekrar istek yapma
      const requestKey = `${bookStartIndex}-${allQueryIndex}`;
      if (lastRequestedKey.current === requestKey) {
        console.log(`⏭️ Duplicate request engellendi: ${requestKey}`);
        return;
      }
      lastRequestedKey.current = requestKey;

      // İlk yükleme kontrolü (sadece en baştaki sorgu)
      const isVeryFirstLoad = bookStartIndex === 0 && allQueryIndex === 0;

      if (isVeryFirstLoad) {
        setLoading(true);
        seenBookIds.current.clear(); // İlk sayfada ID setini temizle
      } else if (bookStartIndex === 0) {
        // Yeni sorguya geçildi ama ilk yükleme değil - loading devam etsin
      } else {
        setBookLoadingMore(true);
      }

      try {
        // Seçili kategorinin arama sorgusunu al - dile göre farklı sorgu
        let searchTerm: string;
        if (bookCategory === "all") {
          // "Tümü" için harf/kelime rotasyonu kullan
          searchTerm = allCategoryQueries[allQueryIndex] || "a";
        } else {
          const selectedCategory = bookCategories.find(
            (c) => c.value === bookCategory
          );
          // Dile göre uygun sorguyu seç
          if (bookLang === "tr") {
            searchTerm = selectedCategory?.queryTr || "roman";
          } else if (bookLang === "en") {
            searchTerm = selectedCategory?.queryEn || "subject:fiction";
          } else {
            // Tüm diller - startIndex'e göre TR/EN sorgusunu dönüşümlü kullan
            // İlk sayfa ve çift sayılı sayfalar için TR, tek sayılı sayfalar için EN
            const pageNumber = Math.floor(bookStartIndex / 40);
            if (pageNumber % 2 === 0) {
              searchTerm = selectedCategory?.queryTr || "roman";
            } else {
              searchTerm = selectedCategory?.queryEn || "subject:fiction";
            }
          }
        }

        console.log(
          `📚 Kitap arama: "${searchTerm}", startIndex: ${bookStartIndex}, queryIndex: ${allQueryIndex}, lang: ${
            bookLang || "all"
          }`
        );

        // Dil filtresi (boş ise tüm diller) - q parametresinden BAĞIMSIZ langRestrict
        const langParam = bookLang || undefined;
        // Ticari kitaplar için paid-ebooks filtresi (daha kaliteli sonuçlar)
        // Not: Bazı dillerde paid-ebooks çok az sonuç verebilir, bu yüzden opsiyonel
        const filterParam = undefined; // 'paid-ebooks' çok kısıtlayıcı olabilir

        const response = await externalApi.searchBooks(
          searchTerm,
          bookStartIndex,
          40,
          "relevance",
          langParam,
          filterParam
        );

        // Başarılı istek - rate limit sayacını sıfırla
        rateLimitRetryCount.current = 0;

        let results = response.items || [];

        // ============================================
        // CLIENT-SIDE KALİTE FİLTRELEMESİ + HTML TEMİZLEME
        // ============================================
        // Resmi, açıklaması veya yazarı olmayan "çöp" kitapları filtrele
        // HTML taglarını temizle (Google Books bazen <b>, <p>, <i> döndürüyor)
        results = results.filter((book: GoogleBook) => {
          // Kapak resmi olmalı (posterUrl veya thumbnail)
          const hasCover = book.posterUrl || book.thumbnail;
          if (!hasCover) return false;
          // Başlık olmalı
          const title = book.baslik || book.title;
          if (!title || title.trim().length < 2) return false;
          // Yazar veya açıklama olmalı (en az biri)
          const hasAuthor =
            (book.yazarlar && book.yazarlar.length > 0) ||
            (book.authors && book.authors.length > 0);
          // Açıklamayı HTML'den temizle ve kontrol et
          const rawDescription = book.aciklama || book.description || "";
          const cleanDescription = stripHtmlTags(rawDescription);
          const hasDescription = cleanDescription.length > 20;
          if (!hasAuthor && !hasDescription) return false;
          return true;
        });

        // HTML taglarını tüm açıklamalardan temizle
        results = results.map((book: GoogleBook) => ({
          ...book,
          aciklama: stripHtmlTags(book.aciklama),
          description: stripHtmlTags(book.description),
        }));

        // CLIENT-SIDE DİL FİLTRELEMESİ (langRestrict API'de her zaman çalışmıyor)
        if (bookLang) {
          const beforeFilter = results.length;
          results = results.filter((book: GoogleBook) => {
            const bookLanguage = book.dil || book.language || "";
            return bookLanguage === bookLang;
          });
          console.log(
            `🌍 Dil filtresi (${bookLang}): ${beforeFilter} -> ${results.length} kitap`
          );
        }

        // Sonuç gelmedi veya API limiti (1000) - sonraki sorguya geç
        if (results.length === 0 || bookStartIndex >= 960) {
          if (
            bookCategory === "all" &&
            allQueryIndex < allCategoryQueries.length - 1
          ) {
            // Sonraki harfe/kelimeye geç
            console.log(
              `🔄 Sonraki sorguya geçiliyor: ${
                allCategoryQueries[allQueryIndex + 1]
              }`
            );
            setAllQueryIndex((prev) => prev + 1);
            setBookStartIndex(0);
            // Loading state'leri temizle ki scroll handler çalışsın
            setBookLoadingMore(false);
            setLoading(false);
            return; // useEffect tekrar tetiklenecek
          } else if (
            bookCategory !== "all" &&
            bookStartIndex < 960 &&
            results.length === 0
          ) {
            // Belirli kategori seçiliyken sonuç gelmezse devam et
            console.log(
              `⏩ Kategori aramasında sonuç yok, devam: startIndex ${bookStartIndex} -> ${
                bookStartIndex + 40
              }`
            );
            setBookStartIndex((prev) => prev + 40);
            setBookLoadingMore(false);
            setLoading(false);
            return;
          } else {
            // Gerçekten sonuç kalmadı
            setBookHasMore(false);
          }
        }

        // Güçlü duplicate kontrolü - useRef ile kalıcı set
        let uniqueNewResults = results.filter((r: GoogleBook) => {
          if (seenBookIds.current.has(r.id)) {
            return false;
          }
          seenBookIds.current.add(r.id);
          return true;
        });

        // Yıl filtresi uygula (appliedFilters'tan)
        // Aralıktaki kitaplar + tarihi bilinmeyenler gösterilsin, aralık dışındakiler çıkarılsın
        if (appliedFilters.minYear || appliedFilters.maxYear) {
          const minY = appliedFilters.minYear
            ? parseInt(String(appliedFilters.minYear), 10)
            : 0;
          const maxY = appliedFilters.maxYear
            ? parseInt(String(appliedFilters.maxYear), 10)
            : 9999;

          const inRange: GoogleBook[] = [];
          const noDate: GoogleBook[] = [];

          uniqueNewResults.forEach((book: GoogleBook) => {
            const year = parseYearFromDate(
              book.yayinTarihi || book.publishedDate
            );
            if (year === 0) {
              noDate.push(book);
            } else if (year >= minY && year <= maxY) {
              inRange.push(book);
            }
            // Aralık dışındakiler çıkarılıyor
          });

          uniqueNewResults = [...inRange, ...noDate];
        }

        // Puan filtresi uygula (kitaplar için - 5 üzerinden 10'a çevir)
        if (appliedFilters.minPuan) {
          uniqueNewResults = uniqueNewResults.filter((book: GoogleBook) => {
            const rating = book.ortalamaPuan || book.averageRating || 0;
            // Google Books 5 üzerinden, UI 10 üzerinden gösteriyor
            const rating10 = rating * 2;
            return rating10 >= appliedFilters.minPuan!;
          });
        }

        // "Tümü" kategorisinde sonuçları karıştır (shuffle)
        if (bookCategory === "all" && uniqueNewResults.length > 0) {
          for (let i = uniqueNewResults.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [uniqueNewResults[i], uniqueNewResults[j]] = [
              uniqueNewResults[j],
              uniqueNewResults[i],
            ];
          }
        }

        // Callback form kullanarak stale closure sorununu önle
        // İlk yükleme: 36 kitaba ulaşana kadar sorgular devam eder
        const isInitialLoading = bookStartIndex === 0; // Bu sorgunun ilk sayfası mı?

        if (isInitialLoading) {
          setBookResults((prev) => {
            const merged = [...prev, ...uniqueNewResults];
            const totalCount = merged.length;

            // İlk yüklemede minimum 36 kitap gelene kadar devam et
            const MIN_INITIAL_BOOKS = 36;
            if (
              totalCount < MIN_INITIAL_BOOKS &&
              bookCategory === "all" &&
              allQueryIndex < allCategoryQueries.length - 1
            ) {
              console.log(
                `📚 İlk yükleme: ${totalCount} kitap var, ${MIN_INITIAL_BOOKS} olana kadar devam ediliyor (sorgu ${
                  allQueryIndex + 1
                })`
              );
              // Sonraki sorguya geç
              setTimeout(() => {
                setAllQueryIndex((prevIdx) => prevIdx + 1);
              }, 0);
            } else if (totalCount >= MIN_INITIAL_BOOKS) {
              // Yeterli kitap var, loading'i kapat
              setBookDataLoaded(true);
              setLoading(false);
            }

            return merged;
          });
        } else {
          setBookResults((prev) => {
            // Duplicate kontrolü - prev array'inde olan ID'leri filtrele
            const existingIds = new Set(prev.map((b) => b.id));
            const trulyNew = uniqueNewResults.filter(
              (b) => !existingIds.has(b.id)
            );

            // Scroll ile yüklemede sonuç olmadıysa ve "Tümü" kategorisindeyse sonraki sorguya geç
            if (
              trulyNew.length === 0 &&
              bookCategory === "all" &&
              allQueryIndex < allCategoryQueries.length - 1
            ) {
              console.log(
                `🔄 Scroll: Sonuç yok, sonraki sorguya geçiliyor: ${
                  allQueryIndex + 1
                }`
              );
              setAllQueryIndex((prevIdx) => prevIdx + 1);
              setBookStartIndex(0);
            }

            return [...prev, ...trulyNew];
          });
        }

        // "Tümü" kategorisinde her zaman devam et (rotasyon var)
        if (bookCategory === "all") {
          setBookHasMore(
            allQueryIndex < allCategoryQueries.length - 1 || results.length > 0
          );
        } else {
          setBookHasMore(results.length > 0);
        }

        // Tüm sorgular bittiyse loading'i kapat
        if (allQueryIndex >= allCategoryQueries.length - 1) {
          setBookDataLoaded(true);
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error("Kitap yükleme hatası:", err);

        // Rate limit kontrolü (429 hatası)
        const isRateLimited =
          err instanceof Error &&
          (err.message.includes("429") ||
            err.message.includes("rate") ||
            err.message.includes("limit"));

        if (isRateLimited) {
          rateLimitRetryCount.current += 1;
          console.warn(
            `⚠️ Rate limit! Deneme: ${rateLimitRetryCount.current}/${MAX_RATE_LIMIT_RETRIES}`
          );

          if (rateLimitRetryCount.current >= MAX_RATE_LIMIT_RETRIES) {
            console.error("❌ Rate limit aşıldı, yükleme durduruluyor");
            setBookHasMore(false);
            setLoading(false);
            setBookLoadingMore(false);
            return;
          }
        }

        // Hata durumunda sonraki sorguya geç (rate limit değilse veya limit aşılmadıysa)
        if (
          bookCategory === "all" &&
          allQueryIndex < allCategoryQueries.length - 1
        ) {
          setAllQueryIndex((prev) => prev + 1);
          setBookStartIndex(0);
        } else {
          setBookHasMore(false);
          setLoading(false);
          setBookLoadingMore(false);
        }
      } finally {
        // Scroll durumunda (startIndex > 0) loading'i kapat
        if (bookStartIndex > 0) {
          setBookLoadingMore(false);
        }
      }
    };

    loadBooksData();
    // bookDataLoaded'ı dependency'den çıkardık çünkü infinite scroll'u engelliyordu
    // bookStartIndex veya allQueryIndex değişince her zaman yeni veri çekmeli
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    bookCategory,
    bookLang,
    searchQuery,
    bookStartIndex,
    allQueryIndex,
    appliedFilters.minYear,
    appliedFilters.maxYear,
    appliedFilters.minPuan,
  ]);

  // Arama tetikle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, tmdbFilter, handleSearch]);

  // URL params güncelle - tüm filtreler dahil
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    params.set("tab", activeTab);

    // TMDB filtreleri
    if (tmdbFilter !== "all") params.set("tmdbFilter", tmdbFilter);
    if (tmdbSort !== "popular") params.set("tmdbSort", tmdbSort);

    // Kitap filtreleri
    if (bookLang) params.set("bookLang", bookLang);
    if (bookCategory !== "all") params.set("bookCategory", bookCategory);

    // Yıl filtreleri
    if (appliedFilters.minYear)
      params.set("minYear", appliedFilters.minYear.toString());
    if (appliedFilters.maxYear)
      params.set("maxYear", appliedFilters.maxYear.toString());
    if (appliedFilters.minPuan)
      params.set("minPuan", appliedFilters.minPuan.toString());

    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    activeTab,
    tmdbFilter,
    tmdbSort,
    bookLang,
    bookCategory,
    appliedFilters.minYear,
    appliedFilters.maxYear,
    appliedFilters.minPuan,
    setSearchParams,
  ]);

  // İçerik import et
  const handleImport = async (id: string, type: "film" | "kitap" | "tv") => {
    setImporting(id);
    try {
      let icerik;
      if (type === "film") {
        icerik = await externalApi.importTmdbFilm(id);
      } else if (type === "tv") {
        icerik = await externalApi.importTmdbTvShow(id);
      } else {
        icerik = await externalApi.importBook(id);
      }
      // İçerik detayına yönlendir
      const tur = type === "tv" ? "film" : type; // Diziler de film olarak kaydediliyor
      navigate(`/icerik/${tur}/${icerik.id}`);
    } catch (err) {
      console.error("Import hatası:", err);
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="flex gap-6 px-6 lg:px-8">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Keşfet</h1>
          <p className="text-[#8E8E93]">
            Film ve kitapları keşfedin, kütüphanenize ekleyin.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]"
            aria-hidden="true"
          />
          <input
            id="search-input"
            name="search"
            type="text"
            placeholder="Film veya kitap ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Film veya kitap ara"
            className="w-full bg-[rgba(118,118,128,0.24)] border-none pl-12 pr-12 py-4 rounded-2xl text-white text-base focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white transition-colors"
              aria-label="Aramayı temizle"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
          {[
            { id: "tmdb", label: "Film & Dizi", icon: <Film size={16} /> },
            { id: "kitaplar", label: "Kitaplar", icon: <BookOpen size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[#6C5CE7] text-white"
                  : "bg-white/5 text-[#8E8E93] hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <ContentSkeleton key={i} />
            ))}
          </div>
        )}

        {/* TMDB Results - arama veya sıralama sonuçları */}
        {!loading && activeTab === "tmdb" && (
          <>
            {tmdbResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tmdbResults.map((film) => {
                  const mediaType = film.mediaType === "tv" ? "tv" : "film";
                  return (
                    <ExternalCard
                      key={`${mediaType}-${film.id}`}
                      item={film}
                      type={mediaType}
                      onImport={() => handleImport(film.id, mediaType)}
                      importing={importing === film.id}
                    />
                  );
                })}
              </div>
            ) : searchQuery.trim().length >= 2 ? (
              <NebulaCard className="text-center py-12">
                <Film size={48} className="mx-auto mb-4 text-[#8E8E93]" />
                <p className="text-[#8E8E93]">
                  "{searchQuery}" için TMDB'de sonuç bulunamadı.
                </p>
              </NebulaCard>
            ) : null}
            {tmdbLoadingMore && (
              <div className="flex justify-center py-6">
                <Loader2 size={24} className="animate-spin text-[#6C5CE7]" />
              </div>
            )}
          </>
        )}

        {/* Kitap sonuçları */}
        {!loading && activeTab === "kitaplar" && (
          <>
            {bookResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {bookResults.map((book) => {
                  // Veritabanından gelen kitap mı kontrol et
                  const isDbBook = book.id.startsWith("db-");
                  const dbId = isDbBook
                    ? parseInt(book.id.replace("db-", ""))
                    : undefined;

                  return (
                    <ExternalCard
                      key={book.id}
                      item={book}
                      type="kitap"
                      onImport={() => handleImport(book.id, "kitap")}
                      importing={importing === book.id}
                      dbId={dbId}
                      onNavigate={(id) => navigate(`/icerik/kitap/${id}`)}
                    />
                  );
                })}
              </div>
            ) : searchQuery.trim().length >= 2 ? (
              <NebulaCard className="text-center py-12">
                <BookOpen size={48} className="mx-auto mb-4 text-[#8E8E93]" />
                <p className="text-[#8E8E93]">
                  "{searchQuery}" için kitap bulunamadı.
                </p>
              </NebulaCard>
            ) : null}
            {bookLoadingMore && (
              <div className="flex justify-center py-6">
                <Loader2 size={24} className="animate-spin text-[#00b894]" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Sidebar - Filter Panel */}
      <div className="hidden lg:block w-[300px] flex-shrink-0">
        <div className="sticky top-6">
          <FilterPanel
            activeTab={activeTab}
            tmdbFilter={tmdbFilter}
            onTmdbFilterChange={handleTmdbFilterChange}
            tmdbSort={tmdbSort}
            onTmdbSortChange={handleTmdbSortChange}
            bookCategory={bookCategory}
            bookCategories={bookCategories}
            onBookCategoryChange={handleBookCategoryChange}
            bookLang={bookLang}
            bookLanguages={bookLanguages}
            onBookLangChange={handleBookLangChange}
            minYear={minYear}
            maxYear={maxYear}
            minPuan={minPuan}
            selectedGenres={selectedGenres}
            onMinYearChange={setMinYear}
            onMaxYearChange={setMaxYear}
            onMinPuanChange={handleMinPuanChange}
            onGenresChange={setSelectedGenres}
            onApply={applyFilters}
            onReset={resetFilters}
          />
        </div>
      </div>
    </div>
  );
}
