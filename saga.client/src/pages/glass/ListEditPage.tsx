import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  GripVertical,
  Globe,
  Lock,
  Save,
  Film,
  BookOpen,
  X,
  Plus,
  Search,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { listeApi, icerikApi } from "../../services/api";
import type { Liste, IcerikListItem } from "../../services/api";

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
  variant?: "primary" | "secondary" | "ghost" | "danger";
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
    danger: "bg-[#d63031] text-white hover:bg-[#c0392b]",
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

export default function ListEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [liste, setListe] = useState<Liste | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [herkeseAcik, setHerkeseAcik] = useState(false);
  const [icerikler, setIcerikler] = useState<
    Array<{
      id: number;
      icerikId: number;
      baslik: string;
      posterUrl?: string;
      tur: string;
      sira: number;
      notMetni?: string;
    }>
  >([]);

  // İçerik ekleme modalı
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IcerikListItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Silme işlemi
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Giriş yapmamışsa listelerim sayfasına yönlendir (auth yüklendikten sonra)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/listelerim");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Liste verilerini yükle
  useEffect(() => {
    const loadListe = async () => {
      if (!id || authLoading || !isAuthenticated) return;

      setLoading(true);
      setError(null);
      try {
        const data = await listeApi.getById(parseInt(id));
        setListe(data);
        setAd(data.ad);
        setAciklama(data.aciklama || "");
        setHerkeseAcik(data.herkeseAcik);

        // İçerikleri düzenle
        if (data.icerikler) {
          setIcerikler(
            data.icerikler.map((i, index) => ({
              id: i.icerikId,
              icerikId: i.icerikId,
              baslik: i.baslik,
              posterUrl: i.posterUrl,
              tur: i.tur,
              sira: i.sira || index + 1,
              notMetni: i.notMetni,
            }))
          );
        }
      } catch (err) {
        console.error("Liste yüklenirken hata:", err);
        setError("Liste yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    loadListe();
  }, [id, authLoading, isAuthenticated]);

  // İçerik ara
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await icerikApi.ara(searchQuery);
      // Zaten listede olanları filtrele
      const existingIds = new Set(icerikler.map((i) => i.icerikId));
      setSearchResults(response.data.filter((r) => !existingIds.has(r.id)));
    } catch (err) {
      console.error("Arama hatası:", err);
    } finally {
      setSearching(false);
    }
  };

  // İçerik ekle
  const handleAddIcerik = async (icerik: IcerikListItem) => {
    if (!liste) return;

    try {
      await listeApi.addIcerik(liste.id, icerik.id, icerikler.length + 1);
      setIcerikler((prev) => [
        ...prev,
        {
          id: icerik.id,
          icerikId: icerik.id,
          baslik: icerik.baslik,
          posterUrl: icerik.posterUrl,
          tur: icerik.tur,
          sira: prev.length + 1,
        },
      ]);
      // Arama sonuçlarından kaldır
      setSearchResults((prev) => prev.filter((r) => r.id !== icerik.id));
    } catch (err) {
      console.error("İçerik eklenirken hata:", err);
    }
  };

  // İçerik çıkar
  const handleRemoveIcerik = async (icerikId: number) => {
    if (!liste) return;

    setRemovingId(icerikId);
    try {
      await listeApi.removeIcerik(liste.id, icerikId);
      setIcerikler((prev) => prev.filter((i) => i.icerikId !== icerikId));
    } catch (err) {
      console.error("İçerik çıkarılırken hata:", err);
    } finally {
      setRemovingId(null);
    }
  };

  // Liste bilgilerini kaydet
  const handleSave = async () => {
    if (!liste || !ad.trim()) return;

    setSaving(true);
    try {
      await listeApi.update(liste.id, {
        ad: ad.trim(),
        aciklama: aciklama.trim() || undefined,
        herkeseAcik,
      });
      navigate("/listelerim");
    } catch (err) {
      console.error("Liste kaydedilirken hata:", err);
      alert("Liste kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  // İçeriği yukarı taşı
  const moveUp = (index: number) => {
    if (index === 0) return;
    setIcerikler((prev) => {
      const newList = [...prev];
      [newList[index - 1], newList[index]] = [
        newList[index],
        newList[index - 1],
      ];
      return newList.map((item, i) => ({ ...item, sira: i + 1 }));
    });
  };

  // İçeriği aşağı taşı
  const moveDown = (index: number) => {
    if (index === icerikler.length - 1) return;
    setIcerikler((prev) => {
      const newList = [...prev];
      [newList[index], newList[index + 1]] = [
        newList[index + 1],
        newList[index],
      ];
      return newList.map((item, i) => ({ ...item, sira: i + 1 }));
    });
  };

  if (!isAuthenticated) {
    navigate("/giris");
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-[#6C5CE7]" />
      </div>
    );
  }

  if (error || !liste) {
    return (
      <GlassCard className="text-center py-12">
        <p className="text-[#8E8E93]">{error || "Liste bulunamadı."}</p>
        <Button className="mt-4" onClick={() => navigate("/listelerim")}>
          Listelere Dön
        </Button>
      </GlassCard>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => navigate("/listelerim")}
          className="p-2 -ml-2 rounded-lg hover:bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:text-white transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Listeyi Düzenle
          </h1>
          <p className="text-[rgba(255,255,255,0.5)] text-xs sm:text-sm truncate">
            {liste.ad}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !ad.trim()}
          className="flex-shrink-0"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span className="hidden sm:inline">Kaydediliyor...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span className="hidden sm:inline">Kaydet</span>
            </>
          )}
        </Button>
      </div>

      {/* Liste Bilgileri */}
      <GlassCard className="!p-4 sm:!p-5">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
          Liste Bilgileri
        </h2>

        <div className="space-y-3 sm:space-y-4">
          {/* Ad */}
          <div>
            <label className="block text-xs sm:text-sm text-[rgba(255,255,255,0.6)] mb-1.5 sm:mb-2">
              Liste Adı *
            </label>
            <input
              type="text"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder="Liste adı..."
              style={{ color: "white" }}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-sm sm:text-base placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#6C5CE7] transition-colors"
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs sm:text-sm text-[rgba(255,255,255,0.6)] mb-1.5 sm:mb-2">
              Açıklama
            </label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Liste hakkında kısa bir açıklama..."
              rows={3}
              style={{ color: "white" }}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-sm sm:text-base placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#6C5CE7] transition-colors resize-none"
            />
          </div>

          {/* Gizlilik */}
          <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {herkeseAcik ? (
                <Globe size={18} className="text-[#00CEC9] flex-shrink-0" />
              ) : (
                <Lock
                  size={18}
                  className="text-[rgba(255,255,255,0.5)] flex-shrink-0"
                />
              )}
              <div>
                <p
                  className="text-sm sm:text-base font-medium"
                  style={{ color: "white" }}
                >
                  {herkeseAcik ? "Herkese Açık" : "Gizli Liste"}
                </p>
                <p
                  className="text-[10px] sm:text-xs"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {herkeseAcik ? "Herkes görebilir" : "Sadece sen görebilirsin"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setHerkeseAcik(!herkeseAcik)}
              style={{
                backgroundColor: herkeseAcik
                  ? "#00CEC9"
                  : "rgba(255,255,255,0.2)",
                width: "48px",
                height: "24px",
                borderRadius: "12px",
                position: "relative",
                flexShrink: 0,
                border: "none",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  left: herkeseAcik ? "28px" : "4px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* İçerikler */}
      <GlassCard className="!p-4 sm:!p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-white">
            İçerikler ({icerikler.length})
          </h2>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} />
            <span className="hidden sm:inline">İçerik Ekle</span>
            <span className="sm:hidden">Ekle</span>
          </Button>
        </div>

        {icerikler.length > 0 ? (
          <div className="space-y-2">
            {icerikler.map((icerik, index) => (
              <div
                key={icerik.icerikId}
                className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] group"
              >
                {/* Sıra değiştirme */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <GripVertical size={14} className="rotate-180" />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === icerikler.length - 1}
                    className="p-1 rounded hover:bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <GripVertical size={14} />
                  </button>
                </div>

                {/* Sıra numarası */}
                <span className="w-6 text-center text-sm text-[rgba(255,255,255,0.4)]">
                  {index + 1}
                </span>

                {/* Poster */}
                <div className="w-10 h-14 rounded-lg overflow-hidden bg-[rgba(255,255,255,0.05)] flex-shrink-0">
                  {icerik.posterUrl ? (
                    <img
                      src={icerik.posterUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {icerik.tur === "kitap" ? (
                        <BookOpen
                          size={16}
                          className="text-[rgba(255,255,255,0.3)]"
                        />
                      ) : (
                        <Film
                          size={16}
                          className="text-[rgba(255,255,255,0.3)]"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Bilgi */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {icerik.baslik}
                  </p>
                  <p className="text-xs text-[rgba(255,255,255,0.4)] capitalize">
                    {icerik.tur}
                  </p>
                </div>

                {/* Sil butonu */}
                <button
                  onClick={() => handleRemoveIcerik(icerik.icerikId)}
                  disabled={removingId === icerik.icerikId}
                  className="p-1.5 sm:p-2 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-[rgba(214,48,49,0.2)] text-[#d63031] transition-all disabled:opacity-50 flex-shrink-0"
                >
                  {removingId === icerik.icerikId ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-[rgba(255,255,255,0.4)]">
            <Film size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm sm:text-base">Henüz içerik eklenmemiş</p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={14} />
              İçerik Ekle
            </Button>
          </div>
        )}
      </GlassCard>

      {/* İçerik Ekleme Modalı */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg sm:mx-4 max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-[rgba(20,20,35,0.98)] sm:bg-[rgba(20,20,35,0.95)] backdrop-blur-xl border-t sm:border border-[rgba(255,255,255,0.1)] shadow-xl">
            {/* Header - mobil için drag handle */}
            <div className="sm:hidden w-10 h-1 bg-[rgba(255,255,255,0.2)] rounded-full mx-auto mt-2 mb-1" />
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base sm:text-lg font-bold text-white">
                İçerik Ekle
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-2 -mr-1 rounded-lg hover:bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Arama */}
            <div className="p-3 sm:p-4 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Film, dizi veya kitap ara..."
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-sm sm:text-base text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#6C5CE7] transition-colors"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="flex-shrink-0"
                >
                  {searching ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Ara"
                  )}
                </Button>
              </div>
            </div>

            {/* Sonuçlar */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((icerik) => (
                    <div
                      key={icerik.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-colors"
                    >
                      {/* Poster */}
                      <div className="w-10 h-14 rounded-lg overflow-hidden bg-[rgba(255,255,255,0.05)] flex-shrink-0">
                        {icerik.posterUrl ? (
                          <img
                            src={icerik.posterUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {icerik.tur === "kitap" ? (
                              <BookOpen
                                size={16}
                                className="text-[rgba(255,255,255,0.3)]"
                              />
                            ) : (
                              <Film
                                size={16}
                                className="text-[rgba(255,255,255,0.3)]"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bilgi */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base text-white font-medium truncate">
                          {icerik.baslik}
                        </p>
                        <p className="text-[10px] sm:text-xs text-[rgba(255,255,255,0.4)] capitalize">
                          {icerik.tur}
                          {icerik.yayinTarihi &&
                            ` • ${new Date(icerik.yayinTarihi).getFullYear()}`}
                        </p>
                      </div>

                      {/* Ekle butonu */}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddIcerik(icerik)}
                        className="flex-shrink-0"
                      >
                        <Plus size={14} />
                        <span className="hidden sm:inline">Ekle</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : searching ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <Loader2 size={22} className="animate-spin text-[#6C5CE7]" />
                </div>
              ) : searchQuery ? (
                <div className="text-center py-6 sm:py-8 text-[rgba(255,255,255,0.4)]">
                  <p className="text-sm">Sonuç bulunamadı</p>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-[rgba(255,255,255,0.4)]">
                  <Search size={28} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Eklemek istediğiniz içeriği arayın</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
