import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Film, BookOpen, Star, Loader2, X, Tv, TrendingUp, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { externalApi } from '../../services/api';
import type { TmdbFilm, GoogleBook } from '../../services/api';

// ============================================
// NEBULA UI COMPONENTS
// ============================================

function NebulaCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 rounded-2xl bg-[rgba(20,20,35,0.65)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-lg ${className}`}>
      {children}
    </div>
  );
}

function NebulaButton({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick 
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyles = {
    primary: 'bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white hover:shadow-lg hover:shadow-[#6C5CE7]/25',
    secondary: 'bg-[rgba(255,255,255,0.08)] text-white border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.12)]',
    ghost: 'bg-transparent text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
  };
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
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
  { id: 28, name: 'Aksiyon' },
  { id: 12, name: 'Macera' },
  { id: 16, name: 'Animasyon' },
  { id: 35, name: 'Komedi' },
  { id: 80, name: 'Suç' },
  { id: 99, name: 'Belgesel' },
  { id: 18, name: 'Dram' },
  { id: 10751, name: 'Aile' },
  { id: 14, name: 'Fantastik' },
  { id: 36, name: 'Tarih' },
  { id: 27, name: 'Korku' },
  { id: 10402, name: 'Müzik' },
  { id: 9648, name: 'Gizem' },
  { id: 10749, name: 'Romantik' },
  { id: 878, name: 'Bilim Kurgu' },
  { id: 10770, name: 'TV Film' },
  { id: 53, name: 'Gerilim' },
  { id: 10752, name: 'Savaş' },
  { id: 37, name: 'Western' },
];

const TV_GENRES = [
  { id: 10759, name: 'Aksiyon & Macera' },
  { id: 16, name: 'Animasyon' },
  { id: 35, name: 'Komedi' },
  { id: 80, name: 'Suç' },
  { id: 99, name: 'Belgesel' },
  { id: 18, name: 'Dram' },
  { id: 10751, name: 'Aile' },
  { id: 10762, name: 'Çocuk' },
  { id: 9648, name: 'Gizem' },
  { id: 10763, name: 'Haber' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Bilim Kurgu & Fantazi' },
  { id: 10766, name: 'Pembe Dizi' },
  { id: 10767, name: 'Talk Show' },
  { id: 10768, name: 'Savaş & Politik' },
  { id: 37, name: 'Western' },
];

interface FilterPanelProps {
  // Tab
  activeTab: 'tmdb' | 'kitaplar';
  // TMDB filtreleri
  tmdbFilter: 'all' | 'movie' | 'tv';
  onTmdbFilterChange: (filter: 'all' | 'movie' | 'tv') => void;
  tmdbSort: 'popular' | 'top_rated' | 'trending' | 'now_playing';
  onTmdbSortChange: (sort: 'popular' | 'top_rated' | 'trending' | 'now_playing') => void;
  // Kitap filtreleri
  bookSort: 'relevance' | 'newest';
  onBookSortChange: (sort: 'relevance' | 'newest') => void;
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
  bookSort,
  onBookSortChange,
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
  
  // Aktif tab'a göre tür listesi
  const genres = tmdbFilter === 'tv' ? TV_GENRES : FILM_GENRES;

  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      onGenresChange(selectedGenres.filter(id => id !== genreId));
    } else {
      onGenresChange([...selectedGenres, genreId]);
    }
  };

  // Filtre sayısı
  const activeFilterCount = [
    minYear, 
    maxYear, 
    minPuan, 
    selectedGenres.length > 0 ? selectedGenres : null
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
        {activeTab === 'tmdb' && (
          <>
            {/* Medya Türü */}
            <div className="glass-panel p-4 space-y-3">
              <p className="text-xs text-[#8E8E93] uppercase tracking-wider font-medium">Medya Türü</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'Tümü', icon: <Star size={12} /> },
                  { id: 'movie', label: 'Film', icon: <Film size={12} /> },
                  { id: 'tv', label: 'Dizi', icon: <Tv size={12} /> },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onTmdbFilterChange(f.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      tmdbFilter === f.id
                        ? 'bg-[#6C5CE7] text-white'
                        : 'bg-white/5 text-[#8E8E93] hover:bg-white/10'
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
              <p className="text-xs text-[#8E8E93] uppercase tracking-wider font-medium">Sıralama</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'popular', label: 'Popüler', icon: <TrendingUp size={12} /> },
                  { id: 'top_rated', label: 'En Yüksek Puan', icon: <Star size={12} /> },
                  { id: 'trending', label: 'Trend', icon: <TrendingUp size={12} /> },
                  { id: 'now_playing', label: tmdbFilter === 'tv' ? 'Yayında' : 'Vizyonda', icon: <Clock size={12} /> },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onTmdbSortChange(s.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      tmdbSort === s.id
                        ? 'bg-[#00CEC9] text-white'
                        : 'bg-white/5 text-[#8E8E93] hover:bg-white/10'
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
                <span>Türler {selectedGenres.length > 0 && `(${selectedGenres.length})`}</span>
                {showGenres ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showGenres && (
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {genres.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        selectedGenres.includes(genre.id)
                          ? 'bg-[#6C5CE7] text-white'
                          : 'bg-white/5 text-[#8E8E93] hover:bg-white/10'
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
        {activeTab === 'kitaplar' && (
          <div className="glass-panel p-4 space-y-3">
            <p className="text-xs text-[#8E8E93] uppercase tracking-wider font-medium">Sıralama</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'relevance', label: 'En İlgili', icon: <Star size={12} /> },
                { id: 'newest', label: 'En Yeni', icon: <Clock size={12} /> },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => onBookSortChange(s.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    bookSort === s.id
                      ? 'bg-[#00b894] text-white'
                      : 'bg-white/5 text-[#8E8E93] hover:bg-white/10'
                  }`}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>
          </div>
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
            {showYearFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showYearFilter && (
            <div className="space-y-3">
              {/* Hızlı Seçim */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Tümü', min: null, max: null },
                  { label: '2024', min: 2024, max: 2024 },
                  { label: '2023', min: 2023, max: 2023 },
                  { label: '2020-2024', min: 2020, max: 2024 },
                  { label: '2010-2019', min: 2010, max: 2019 },
                  { label: '2000-2009', min: 2000, max: 2009 },
                  { label: 'Klasik (<2000)', min: null, max: 1999 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      onMinYearChange(preset.min);
                      onMaxYearChange(preset.max);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      minYear === preset.min && maxYear === preset.max
                        ? 'bg-[#6C5CE7] text-white'
                        : 'bg-white/5 text-[#8E8E93] hover:bg-white/10'
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
                  value={minYear || ''}
                  onChange={(e) => onMinYearChange(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-white/5 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]/50 border border-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[#8E8E93] text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  min="1900"
                  max="2025"
                  value={maxYear || ''}
                  onChange={(e) => onMaxYearChange(e.target.value ? parseInt(e.target.value) : null)}
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
            {showRatingFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showRatingFilter && (
            <div className="flex flex-wrap gap-1.5">
              {[null, 5, 6, 7, 8, 9].map((puan) => (
                <button
                  key={puan ?? 'all'}
                  onClick={() => onMinPuanChange(puan)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    minPuan === puan
                      ? 'bg-[#f39c12]/20 text-[#f39c12] border border-[#f39c12]/30'
                      : 'bg-white/5 text-[#8E8E93] border border-transparent hover:bg-white/10'
                  }`}
                >
                  {puan ? `${puan}+` : 'Tümü'}
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
  type: 'film' | 'kitap' | 'tv';
  onImport: () => void;
  importing?: boolean;
}

function ExternalCard({ item, type, onImport, importing }: ExternalCardProps) {
  const isTmdb = type === 'film' || type === 'tv';
  const film = item as TmdbFilm;
  const book = item as GoogleBook;

  // Backend Türkçe alan adları kullanıyor (posterUrl, baslik, puan)
  // HTTP URL'leri HTTPS'e çevir
  let posterUrl: string | undefined;
  if (isTmdb) {
    // Backend posterUrl tam URL döndürüyor, posterPath ise sadece path
    posterUrl = film.posterUrl || (film.posterPath
      ? `https://image.tmdb.org/t/p/w300${film.posterPath}`
      : undefined);
  } else {
    const rawUrl = book.posterUrl || book.thumbnail;
    posterUrl = rawUrl?.replace('http://', 'https://');
  }

  const title = isTmdb ? (film.baslik || film.title) : (book.baslik || book.title);
  const rating = isTmdb ? (film.puan || film.voteAverage) : (book.ortalamaPuan || book.averageRating);
  const year = isTmdb
    ? (film.yayinTarihi || film.releaseDate)?.split('-')[0]
    : (book.yayinTarihi || book.publishedDate)?.split('-')[0];
  
  // Media type belirleme
  const mediaType = isTmdb ? (film.mediaType || type) : 'kitap';
  const displayType = mediaType === 'tv' ? 'Dizi' : mediaType === 'movie' ? 'Film' : type === 'kitap' ? 'Kitap' : 'Film';

  return (
    <div className="group">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2 bg-white/5">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {type === 'tv' ? (
              <Tv size={40} className="text-[#8E8E93]" />
            ) : type === 'film' ? (
              <Film size={40} className="text-[#8E8E93]" />
            ) : (
              <BookOpen size={40} className="text-[#8E8E93]" />
            )}
          </div>
        )}
        {rating !== undefined && rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#6C5CE7]/20 backdrop-blur-md px-1.5 py-0.5 rounded-md">
            <Star size={10} className="text-[#6C5CE7] fill-[#6C5CE7]" />
            <span className="text-xs text-white font-semibold">{rating.toFixed(1)}</span>
          </div>
        )}
        {/* Media type badge */}
        {isTmdb && mediaType === 'tv' && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#00CEC9]/80 text-white text-xs font-medium">
            Dizi
          </div>
        )}
        {/* Import overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <NebulaButton
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onImport();
            }}
            disabled={importing}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : 'Ekle'}
          </NebulaButton>
        </div>
      </div>
      <h3 className="font-medium text-white text-sm line-clamp-2">{title}</h3>
      <div className="flex items-center gap-2 mt-1">
        {type === 'tv' ? (
          <Tv size={12} className="text-[#00CEC9]" />
        ) : type === 'film' ? (
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

  // States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState<'tmdb' | 'kitaplar'>(
    (searchParams.get('tab') as any) || 'tmdb'
  );

  // TMDB filters
  const [tmdbFilter, setTmdbFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [tmdbSort, setTmdbSort] = useState<'popular' | 'top_rated' | 'trending' | 'now_playing'>('popular');

  // Kitap filters
  const [bookSort, setBookSort] = useState<'relevance' | 'newest'>('relevance');

  // Advanced filter states
  const [minYear, setMinYear] = useState<number | null>(null);
  const [maxYear, setMaxYear] = useState<number | null>(null);
  const [minPuan, setMinPuan] = useState<number | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [appliedFilters, setAppliedFilters] = useState({ 
    minYear: null as number | null, 
    maxYear: null as number | null, 
    minPuan: null as number | null,
    genres: [] as number[]
  });

  // Data states
  const [tmdbResults, setTmdbResults] = useState<TmdbFilm[]>([]);
  const [bookResults, setBookResults] = useState<GoogleBook[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  // Filter helper - filtre uygulama
  const applyFilters = () => {
    setAppliedFilters({ minYear, maxYear, minPuan, genres: selectedGenres });
  };

  const resetFilters = () => {
    setMinYear(null);
    setMaxYear(null);
    setMinPuan(null);
    setSelectedGenres([]);
    setAppliedFilters({ minYear: null, maxYear: null, minPuan: null, genres: [] });
  };

  // TMDB verilerini yükle (arama yokken sıralamaya göre)
  const loadTmdbData = useCallback(async () => {
    if (activeTab !== 'tmdb') return;
    
    // Arama varsa arama yap
    if (searchQuery.trim().length >= 2) {
      setLoading(true);
      try {
        let results: TmdbFilm[];
        if (tmdbFilter === 'movie') {
          results = await externalApi.searchTmdb(searchQuery);
        } else if (tmdbFilter === 'tv') {
          results = await externalApi.searchTmdbTv(searchQuery);
        } else {
          results = await externalApi.searchTmdbMulti(searchQuery);
        }
        setTmdbResults(results);
      } catch (err) {
        console.error('TMDB arama hatası:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Arama yoksa sıralamaya göre yükle
    setLoading(true);
    try {
      let results: TmdbFilm[] = [];
      
      if (tmdbSort === 'popular') {
        if (tmdbFilter === 'movie') {
          results = await externalApi.getTmdbPopular();
        } else if (tmdbFilter === 'tv') {
          results = await externalApi.getTmdbPopularTv();
        } else {
          const [movies, tv] = await Promise.all([
            externalApi.getTmdbPopular(),
            externalApi.getTmdbPopularTv(),
          ]);
          results = [...movies, ...tv].sort((a, b) => (b.puan || 0) - (a.puan || 0));
        }
      } else if (tmdbSort === 'top_rated') {
        if (tmdbFilter === 'movie') {
          results = await externalApi.getTmdbTopRated();
        } else if (tmdbFilter === 'tv') {
          results = await externalApi.getTmdbTopRatedTv();
        } else {
          const [movies, tv] = await Promise.all([
            externalApi.getTmdbTopRated(),
            externalApi.getTmdbTopRatedTv(),
          ]);
          results = [...movies, ...tv].sort((a, b) => (b.puan || 0) - (a.puan || 0));
        }
      } else if (tmdbSort === 'trending') {
        const mediaType = tmdbFilter === 'movie' ? 'movie' : tmdbFilter === 'tv' ? 'tv' : 'all';
        results = await externalApi.getTmdbTrending(mediaType);
      } else if (tmdbSort === 'now_playing') {
        if (tmdbFilter === 'movie') {
          results = await externalApi.getTmdbNowPlaying();
        } else if (tmdbFilter === 'tv') {
          results = await externalApi.getTmdbOnTheAir();
        } else {
          const [movies, tv] = await Promise.all([
            externalApi.getTmdbNowPlaying(),
            externalApi.getTmdbOnTheAir(),
          ]);
          results = [...movies, ...tv];
        }
      }
      
      // Filtreleri uygula (yıl, puan ve tür)
      if (appliedFilters.minYear || appliedFilters.maxYear || appliedFilters.minPuan || appliedFilters.genres.length > 0) {
        results = results.filter(item => {
          // Yıl filtresi
          const year = item.yayinTarihi ? parseInt(item.yayinTarihi.split('-')[0]) : null;
          if (appliedFilters.minYear && (!year || year < appliedFilters.minYear)) return false;
          if (appliedFilters.maxYear && (!year || year > appliedFilters.maxYear)) return false;
          
          // Puan filtresi
          if (appliedFilters.minPuan && (!item.puan || item.puan < appliedFilters.minPuan)) return false;
          
          // Tür filtresi - eğer seçili türler varsa, içeriğin en az bir türü eşleşmeli
          if (appliedFilters.genres.length > 0) {
            const itemGenres = item.turIds || [];
            const hasMatchingGenre = appliedFilters.genres.some(genreId => itemGenres.includes(genreId));
            if (!hasMatchingGenre) return false;
          }
          
          return true;
        });
      }
      
      setTmdbResults(results);
    } catch (err) {
      console.error('TMDB veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, tmdbFilter, tmdbSort, appliedFilters]);

  // Arama fonksiyonu
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setBookResults([]);
      // TMDB için ayrıca sıralamaya göre yükle
      if (activeTab === 'tmdb') {
        loadTmdbData();
      } else {
        setTmdbResults([]);
      }
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'tmdb') {
        let results: TmdbFilm[];
        if (tmdbFilter === 'movie') {
          results = await externalApi.searchTmdb(searchQuery);
        } else if (tmdbFilter === 'tv') {
          results = await externalApi.searchTmdbTv(searchQuery);
        } else {
          results = await externalApi.searchTmdbMulti(searchQuery);
        }
        setTmdbResults(results);
      } else if (activeTab === 'kitaplar') {
        const results = await externalApi.searchBooks(searchQuery, 0, 40, bookSort);
        
        // "En Yeni" seçiliyse, yayın yılına göre sırala
        if (bookSort === 'newest' && results.length > 0) {
          results.sort((a, b) => {
            const yearA = parseYearFromDate(a.yayinTarihi);
            const yearB = parseYearFromDate(b.yayinTarihi);
            return yearB - yearA; // En yeniden en eskiye
          });
        }
        
        setBookResults(results);
      }
    } catch (err) {
      console.error('Arama hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeTab, tmdbFilter, bookSort, loadTmdbData]);

  // TMDB verileri yükle (tab veya filtre değişince)
  useEffect(() => {
    if (activeTab === 'tmdb' && !searchQuery.trim()) {
      loadTmdbData();
    }
  }, [activeTab, tmdbFilter, tmdbSort, loadTmdbData, searchQuery, appliedFilters]);

  // Kitaplar için varsayılan veri yükle (tab değişince veya sıralama değişince)
  useEffect(() => {
    const loadBooksData = async () => {
      if (activeTab !== 'kitaplar') return;
      
      // Arama varsa zaten handleSearch çalışacak
      if (searchQuery.trim().length >= 2) return;
      
      setLoading(true);
      try {
        // Varsayılan olarak "bestseller" araması yap
        const results = await externalApi.searchBooks('bestseller', 0, 40, bookSort);
        
        // "En Yeni" seçiliyse, yayın yılına göre sırala (client tarafında)
        if (bookSort === 'newest' && results.length > 0) {
          results.sort((a, b) => {
            const yearA = parseYearFromDate(a.yayinTarihi);
            const yearB = parseYearFromDate(b.yayinTarihi);
            return yearB - yearA; // En yeniden en eskiye
          });
        }
        
        setBookResults(results);
      } catch (err) {
        console.error('Kitap yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadBooksData();
  }, [activeTab, bookSort, searchQuery]);

  // Arama tetikle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, tmdbFilter, bookSort, handleSearch]);

  // URL params güncelle
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    params.set('tab', activeTab);
    setSearchParams(params, { replace: true });
  }, [searchQuery, activeTab, setSearchParams]);

  // İçerik import et
  const handleImport = async (id: string, type: 'film' | 'kitap' | 'tv') => {
    setImporting(id);
    try {
      let icerik;
      if (type === 'film') {
        icerik = await externalApi.importTmdbFilm(id);
      } else if (type === 'tv') {
        icerik = await externalApi.importTmdbTvShow(id);
      } else {
        icerik = await externalApi.importBook(id);
      }
      // İçerik detayına yönlendir
      const tur = type === 'tv' ? 'film' : type; // Diziler de film olarak kaydediliyor
      navigate(`/icerik/${tur}/${icerik.id}`);
    } catch (err) {
      console.error('Import hatası:', err);
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Keşfet</h1>
          <p className="text-[#8E8E93]">Film ve kitapları keşfedin, kütüphanenize ekleyin.</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" aria-hidden="true" />
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
            onClick={() => setSearchQuery('')}
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
          { id: 'tmdb', label: 'Film & Dizi', icon: <Film size={16} /> },
          { id: 'kitaplar', label: 'Kitaplar', icon: <BookOpen size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#6C5CE7] text-white'
                : 'bg-white/5 text-[#8E8E93] hover:bg-white/10 hover:text-white'
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
      {!loading && activeTab === 'tmdb' && (
        <>
          {tmdbResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tmdbResults.map((film) => {
                const mediaType = film.mediaType === 'tv' ? 'tv' : 'film';
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
        </>
      )}

      {/* Kitap sonuçları */}
      {!loading && activeTab === 'kitaplar' && (
        <>
          {bookResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {bookResults.map((book) => (
                <ExternalCard
                  key={book.id}
                  item={book}
                  type="kitap"
                  onImport={() => handleImport(book.id, 'kitap')}
                  importing={importing === book.id}
                />
              ))}
            </div>
          ) : searchQuery.trim().length >= 2 ? (
            <NebulaCard className="text-center py-12">
              <BookOpen size={48} className="mx-auto mb-4 text-[#8E8E93]" />
              <p className="text-[#8E8E93]">
                "{searchQuery}" için kitap bulunamadı.
              </p>
            </NebulaCard>
          ) : null}
        </>
      )}
      </div>

      {/* Right Sidebar - Filter Panel */}
      <div className="hidden lg:block w-[300px] flex-shrink-0">
        <div className="sticky top-6">
          <FilterPanel
            activeTab={activeTab}
            tmdbFilter={tmdbFilter}
            onTmdbFilterChange={setTmdbFilter}
            tmdbSort={tmdbSort}
            onTmdbSortChange={setTmdbSort}
            bookSort={bookSort}
            onBookSortChange={setBookSort}
            minYear={minYear}
            maxYear={maxYear}
            minPuan={minPuan}
            selectedGenres={selectedGenres}
            onMinYearChange={setMinYear}
            onMaxYearChange={setMaxYear}
            onMinPuanChange={setMinPuan}
            onGenresChange={setSelectedGenres}
            onApply={applyFilters}
            onReset={resetFilters}
          />
        </div>
      </div>
    </div>
  );
}
