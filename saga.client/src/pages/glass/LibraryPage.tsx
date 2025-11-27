import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Film,
  Star,
  Calendar,
  Loader2,
  Filter,
  Grid,
  List as ListIcon,
  CheckCircle,
  Eye,
  Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { kutuphaneApi } from "../../services/api";
import type { KutuphaneDurumu } from "../../services/api";

// Kütüphane durumları - Backend enum değerleri: izlendi, izlenecek, okundu, okunacak, devam_ediyor
const DURUM_OPTIONS = [
  { value: "devam_ediyor", label: "İzleniyor", icon: Eye, color: "#6C5CE7" },
  { value: "izlendi", label: "İzlendi", icon: CheckCircle, color: "#00b894" },
  { value: "izlenecek", label: "İzlenecek", icon: Clock, color: "#fdcb6e" },
  { value: "okundu", label: "Okundu", icon: CheckCircle, color: "#00b894" },
  { value: "okunacak", label: "Okunacak", icon: Clock, color: "#fdcb6e" },
] as const;

// ============================================
// NEBULA UI COMPONENTS
// ============================================

function GlassCard({
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

function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50";
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

export default function LibraryPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [kutuphane, setKutuphane] = useState<KutuphaneDurumu[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDurum, setSelectedDurum] = useState<string>("tumu");
  const [selectedTur, setSelectedTur] = useState<string>("tumu");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Kütüphaneyi yükle
  useEffect(() => {
    const loadKutuphane = async () => {
      if (!isAuthenticated || !user) return;

      setLoading(true);
      try {
        const data = await kutuphaneApi.getKutuphane(user.id);
        setKutuphane(data);
      } catch (err) {
        console.error("Kütüphane yüklenirken hata:", err);
      } finally {
        setLoading(false);
      }
    };

    loadKutuphane();
  }, [isAuthenticated, user]);

  // Filtreleme
  const filteredItems = kutuphane.filter((item) => {
    if (selectedDurum !== "tumu" && item.durum !== selectedDurum) return false;
    if (selectedTur !== "tumu" && (item.tur || item.icerikTur) !== selectedTur)
      return false;
    return true;
  });

  // İstatistikler
  const stats = {
    total: kutuphane.length,
    devamEdiyor: kutuphane.filter((i) => i.durum === "devam_ediyor").length,
    tamamlandi: kutuphane.filter(
      (i) => i.durum === "izlendi" || i.durum === "okundu"
    ).length,
    film: kutuphane.filter((i) => (i.tur || i.icerikTur) === "film").length,
    dizi: kutuphane.filter((i) => (i.tur || i.icerikTur) === "dizi").length,
    kitap: kutuphane.filter((i) => (i.tur || i.icerikTur) === "kitap").length,
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <GlassCard className="text-center py-12">
          <BookOpen size={48} className="mx-auto mb-4 text-[#8E8E93]" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Giriş Yapmalısınız
          </h2>
          <p className="text-[#8E8E93] mb-6">
            Kütüphanenizi görüntülemek için giriş yapın.
          </p>
          <Button onClick={() => navigate("/giris")}>Giriş Yap</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kütüphanem</h1>
          <p className="text-[rgba(255,255,255,0.5)] text-sm mt-1">
            {stats.total} içerik
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#6C5CE7]/20">
              <Eye size={20} className="text-[#6C5CE7]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.devamEdiyor}
              </p>
              <p className="text-xs text-[rgba(255,255,255,0.5)]">İzleniyor</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00b894]/20">
              <CheckCircle size={20} className="text-[#00b894]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.tamamlandi}
              </p>
              <p className="text-xs text-[rgba(255,255,255,0.5)]">Tamamlandı</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#fd79a8]/20">
              <Film size={20} className="text-[#fd79a8]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.film}</p>
              <p className="text-xs text-[rgba(255,255,255,0.5)]">Film</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00CEC9]/20">
              <BookOpen size={20} className="text-[#00CEC9]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.kitap}</p>
              <p className="text-xs text-[rgba(255,255,255,0.5)]">Kitap</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[rgba(255,255,255,0.5)]" />
            <span className="text-sm text-[rgba(255,255,255,0.5)]">
              Filtrele:
            </span>
          </div>

          {/* Durum Filter */}
          <select
            value={selectedDurum}
            onChange={(e) => setSelectedDurum(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white text-sm focus:outline-none focus:border-[#6C5CE7]"
          >
            <option value="tumu">Tüm Durumlar</option>
            {DURUM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Tür Filter */}
          <select
            value={selectedTur}
            onChange={(e) => setSelectedTur(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white text-sm focus:outline-none focus:border-[#6C5CE7]"
          >
            <option value="tumu">Tüm Türler</option>
            <option value="film">Film</option>
            <option value="dizi">Dizi</option>
            <option value="kitap">Kitap</option>
          </select>

          {/* View Mode */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-[#6C5CE7] text-white"
                  : "text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.05)]"
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-[#6C5CE7] text-white"
                  : "text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.05)]"
              }`}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[#6C5CE7]" />
        </div>
      ) : filteredItems.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.map((item) => {
              const baslik = item.baslik || item.icerikAdi || "Bilinmiyor";
              const tur = item.tur || item.icerikTur || "film";
              const posterUrl = item.posterUrl || item.icerik?.posterUrl;

              return (
                <button
                  key={item.id || item.icerikId}
                  onClick={() => navigate(`/icerik/${item.icerikId}`)}
                  className="group text-left"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={baslik}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                        {tur === "kitap" ? (
                          <BookOpen size={32} />
                        ) : (
                          <Film size={32} />
                        )}
                      </div>
                    )}
                    {/* Status Badge */}
                    <div
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-medium ${
                        item.durum === "devam_ediyor"
                          ? "bg-[#6C5CE7] text-white"
                          : item.durum === "izlendi" || item.durum === "okundu"
                          ? "bg-[#00b894] text-white"
                          : item.durum === "izlenecek" ||
                            item.durum === "okunacak"
                          ? "bg-[#fdcb6e] text-black"
                          : "bg-[#d63031] text-white"
                      }`}
                    >
                      {DURUM_OPTIONS.find((d) => d.value === item.durum)
                        ?.label || item.durum}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white truncate">
                    {baslik}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.5)]">
                    {tur === "kitap" ? (
                      <BookOpen size={10} />
                    ) : (
                      <Film size={10} />
                    )}
                    <span className="capitalize">{tur}</span>
                    {item.ortalamaPuan && (
                      <>
                        <span>•</span>
                        <Star
                          size={10}
                          className="text-[#FF9F0A] fill-current"
                        />
                        <span>{item.ortalamaPuan.toFixed(1)}</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const baslik = item.baslik || item.icerikAdi || "Bilinmiyor";
              const tur = item.tur || item.icerikTur || "film";
              const posterUrl = item.posterUrl || item.icerik?.posterUrl;

              return (
                <GlassCard
                  key={item.id || item.icerikId}
                  className="p-3 cursor-pointer hover:border-[rgba(255,255,255,0.15)] transition-colors"
                >
                  <button
                    onClick={() => navigate(`/icerik/${item.icerikId}`)}
                    className="w-full flex items-center gap-4 text-left"
                  >
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={baslik}
                        className="w-12 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-16 rounded-lg bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                        {tur === "kitap" ? (
                          <BookOpen size={20} />
                        ) : (
                          <Film size={20} />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {baslik}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[rgba(255,255,255,0.5)]">
                        <span className="capitalize">{tur}</span>
                        {item.ortalamaPuan && (
                          <div className="flex items-center gap-1">
                            <Star
                              size={10}
                              className="text-[#FF9F0A] fill-current"
                            />
                            <span>{item.ortalamaPuan.toFixed(1)}/10</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar size={10} />
                          <span>
                            {new Date(
                              item.guncellemeZamani ||
                                item.olusturulmaZamani ||
                                Date.now()
                            ).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.durum === "devam_ediyor"
                          ? "bg-[#6C5CE7]/20 text-[#6C5CE7]"
                          : item.durum === "izlendi" || item.durum === "okundu"
                          ? "bg-[#00b894]/20 text-[#00b894]"
                          : item.durum === "izlenecek" ||
                            item.durum === "okunacak"
                          ? "bg-[#fdcb6e]/20 text-[#fdcb6e]"
                          : "bg-[#d63031]/20 text-[#d63031]"
                      }`}
                    >
                      {DURUM_OPTIONS.find((d) => d.value === item.durum)
                        ?.label || item.durum}
                    </div>
                  </button>
                </GlassCard>
              );
            })}
          </div>
        )
      ) : (
        <GlassCard className="text-center py-12">
          <BookOpen size={48} className="mx-auto mb-4 text-[#8E8E93]" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Kütüphaneniz Boş
          </h2>
          <p className="text-[#8E8E93] mb-6">
            Film, dizi veya kitap aramaya başlayın ve kütüphanenize ekleyin.
          </p>
          <Button onClick={() => navigate("/kesfet")}>Keşfet</Button>
        </GlassCard>
      )}
    </div>
  );
}
