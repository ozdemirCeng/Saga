import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Star,
  MessageCircle,
  Heart,
  Film,
  BookOpen,
  UserPlus,
  List,
  Play,
  Loader2,
  Send,
  ChevronDown,
  ChevronUp,
  Tv,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { aktiviteApi } from "../services/api";
import type { Aktivite, AktiviteYorum } from "../services/api";

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

interface YorumItemProps {
  yorum: AktiviteYorum;
  isLoggedIn: boolean;
  onYanitla: () => void;
  isReply?: boolean;
}

function YorumItem({
  yorum,
  isLoggedIn,
  onYanitla,
  isReply = false,
}: YorumItemProps) {
  const navigate = useNavigate();
  const [begendim, setBegendim] = useState(yorum.begendim || false);
  const [begeniSayisi, setBegeniSayisi] = useState(yorum.begeniSayisi || 0);
  const [begeniYukleniyor, setBegeniYukleniyor] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const MAX_LENGTH = 150;
  const isLong = yorum.icerik && yorum.icerik.length > MAX_LENGTH;
  const displayText =
    isLong && !expanded
      ? yorum.icerik.substring(0, MAX_LENGTH) + "..."
      : yorum.icerik;

  const handleBegeni = async () => {
    if (!isLoggedIn || begeniYukleniyor) return;
    setBegeniYukleniyor(true);
    try {
      const result = await aktiviteApi.yorumBegen(yorum.id);
      setBegendim(result.begendim);
      setBegeniSayisi(result.begeniSayisi);
    } catch (error) {
      console.error("Yorum beğeni hatası:", error);
    } finally {
      setBegeniYukleniyor(false);
    }
  };

  const tarihStr = formatDistanceToNow(new Date(yorum.olusturulmaZamani), {
    addSuffix: true,
    locale: tr,
  });

  return (
    <div
      className={`${
        isReply ? "ml-8 pl-4 border-l-2 border-[rgba(108,92,231,0.3)]" : ""
      }`}
    >
      <div className="flex gap-3">
        <div
          className="p-0.5 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] cursor-pointer flex-shrink-0"
          onClick={() => navigate(`/profil/${yorum.kullaniciAdi}`)}
        >
          <div className="w-8 h-8 rounded-full bg-[#0a0a12] flex items-center justify-center overflow-hidden">
            {yorum.kullaniciAvatar ? (
              <img
                src={yorum.kullaniciAvatar}
                alt={yorum.kullaniciAdi}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-xs">
                {yorum.kullaniciAdi?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-semibold text-white text-sm cursor-pointer hover:text-[#6C5CE7] transition-colors"
              onClick={() => navigate(`/profil/${yorum.kullaniciAdi}`)}
            >
              {yorum.kullaniciAdi}
            </span>
            <span className="text-xs text-[rgba(255,255,255,0.3)]">
              {tarihStr}
            </span>
          </div>
          <p className="text-sm text-[rgba(255,255,255,0.85)] mt-1 break-words">
            {displayText}
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="ml-1 text-[#6C5CE7] hover:text-[#00CEC9] transition-colors font-medium"
              >
                {expanded ? "daha az" : "daha fazlasını oku"}
              </button>
            )}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleBegeni}
              disabled={begeniYukleniyor || !isLoggedIn}
              className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
                begendim
                  ? "text-[#fd79a8]"
                  : "text-[rgba(255,255,255,0.4)] hover:text-[#fd79a8]"
              }`}
            >
              <Heart size={14} className={begendim ? "fill-[#fd79a8]" : ""} />
              <span>{begeniSayisi > 0 ? begeniSayisi : ""}</span>
            </button>
            {!isReply && isLoggedIn && (
              <button
                onClick={onYanitla}
                className="text-xs text-[rgba(255,255,255,0.4)] hover:text-[#6C5CE7] transition-colors"
              >
                Yanıtla
              </button>
            )}
          </div>
        </div>
      </div>
      {yorum.yanitlar && yorum.yanitlar.length > 0 && (
        <div className="mt-3 space-y-3">
          {yorum.yanitlar.map((yanit) => (
            <YorumItem
              key={yanit.id}
              yorum={yanit}
              isLoggedIn={isLoggedIn}
              onYanitla={() => {}}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface ActivityCardProps {
  aktivite: Aktivite;
  isLoggedIn: boolean;
  showUserInfo?: boolean;
  isOwnProfile?: boolean;
  onDelete?: (aktiviteId: number) => void;
}

export function ActivityCard({
  aktivite,
  isLoggedIn,
  showUserInfo = true,
  isOwnProfile = false,
  onDelete,
}: ActivityCardProps) {
  const navigate = useNavigate();
  const { kullaniciAdi, kullaniciAvatar, olusturulmaZamani, veri } = aktivite;
  const aktiviteTuru = aktivite.aktiviteTuru || aktivite.aktiviteTipiStr || "";

  const [showMenu, setShowMenu] = useState(false);
  const [begeniSayisi, setBegeniSayisi] = useState(aktivite.begeniSayisi || 0);
  const [begendim, setBegendim] = useState(aktivite.begendim || false);
  const [begeniYukleniyor, setBegeniYukleniyor] = useState(false);
  const [yorumSayisi] = useState(aktivite.yorumSayisi || 0);
  const [yorumlarAcik, setYorumlarAcik] = useState(false);
  const [yorumlar, setYorumlar] = useState<AktiviteYorum[]>([]);
  const [yorumlarYukleniyor, setYorumlarYukleniyor] = useState(false);
  const [yeniYorum, setYeniYorum] = useState("");
  const [yorumGonderiliyor, setYorumGonderiliyor] = useState(false);
  const [yanitYapilan, setYanitYapilan] = useState<number | null>(null);
  const [spoilerAcik, setSpoilerAcik] = useState(false);

  const handleBegeni = async () => {
    if (!isLoggedIn || begeniYukleniyor) return;
    setBegeniYukleniyor(true);
    try {
      const result = await aktiviteApi.toggleBegeni(aktivite.id);
      setBegeniSayisi(result.begeniSayisi);
      setBegendim(result.begendim);
    } catch (error) {
      console.error("Beğeni hatası:", error);
    } finally {
      setBegeniYukleniyor(false);
    }
  };

  const loadYorumlar = async () => {
    if (yorumlarYukleniyor) return;
    setYorumlarYukleniyor(true);
    try {
      const result = await aktiviteApi.getYorumlar(aktivite.id);
      setYorumlar(result.data);
    } catch (error) {
      console.error("Yorumlar yüklenirken hata:", error);
    } finally {
      setYorumlarYukleniyor(false);
    }
  };

  const toggleYorumlar = () => {
    if (!yorumlarAcik && yorumlar.length === 0) loadYorumlar();
    setYorumlarAcik(!yorumlarAcik);
  };

  const handleYorumGonder = async () => {
    if (!isLoggedIn || !yeniYorum.trim() || yorumGonderiliyor) return;
    setYorumGonderiliyor(true);
    try {
      const yorum = await aktiviteApi.yorumEkle(aktivite.id, {
        icerik: yeniYorum.trim(),
        ustYorumId: yanitYapilan || undefined,
      });
      setYorumlar((prev) => [yorum, ...prev]);
      setYeniYorum("");
      setYanitYapilan(null);
    } catch (error) {
      console.error("Yorum gönderme hatası:", error);
    } finally {
      setYorumGonderiliyor(false);
    }
  };

  const handleDelete = () => {
    if (onDelete && aktivite.id) onDelete(aktivite.id);
    setShowMenu(false);
  };

  const tarihStr = formatDistanceToNow(new Date(olusturulmaZamani), {
    addSuffix: true,
    locale: tr,
  });

  const getTurIcon = (tur?: string) => {
    if (tur === "film") return <Film size={14} className="text-[#6C5CE7]" />;
    if (tur === "dizi") return <Tv size={14} className="text-[#00CEC9]" />;
    if (tur === "kitap")
      return <BookOpen size={14} className="text-[#fd79a8]" />;
    return null;
  };

  const getAksiyonMetni = () => {
    switch (aktiviteTuru.toLowerCase()) {
      case "puanlama":
        return "bir içeriği puanladı";
      case "yorum":
        return "bir içerik hakkında yorum yaptı";
      case "listeye_ekleme":
      case "kutuphaneyeekleme":
        return "bir içeriği listeye ekledi";
      case "takip":
      case "takipetme":
        return "bir kullanıcıyı takip etmeye başladı";
      case "durum_guncelleme":
        return "kütüphanesini güncelledi";
      case "listeolusturma":
        return "yeni bir liste oluşturdu";
      default:
        return "bir aktivite gerçekleştirdi";
    }
  };

  const handleContentClick = () => {
    if (
      aktivite.icerikId &&
      aktiviteTuru.toLowerCase() !== "takip" &&
      aktiviteTuru.toLowerCase() !== "takipetme"
    ) {
      const tur = veri?.tur || aktivite.icerikTur || "film";
      // Eğer yorum aktivitesiyse, yorumId ile birlikte yönlendir
      if (aktivite.yorumId) {
        navigate(
          `/icerik/${tur}/${aktivite.icerikId}?yorumId=${aktivite.yorumId}`
        );
      } else {
        navigate(`/icerik/${tur}/${aktivite.icerikId}`);
      }
    }
  };

  const handleProfileClick = () => navigate(`/profil/${kullaniciAdi}`);

  const renderPuanlamaContent = () => (
    <div
      className="relative overflow-hidden rounded-xl cursor-pointer group"
      onClick={handleContentClick}
    >
      <div className="relative aspect-video max-h-[280px] overflow-hidden rounded-xl">
        {veri?.posterUrl ? (
          <img
            src={veri.posterUrl}
            alt={veri.baslik}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
            {getTurIcon(veri?.tur)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h4 className="font-bold text-white text-lg line-clamp-2 mb-2">
            {veri?.baslik}
          </h4>
          <div className="flex items-center gap-2 mb-3">
            {getTurIcon(veri?.tur)}
            <span className="text-xs text-[rgba(255,255,255,0.6)] capitalize">
              {veri?.tur}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6C5CE7]/30 to-[#00CEC9]/20 border border-[rgba(108,92,231,0.3)]">
            <Star size={18} className="text-[#FF9F0A] fill-[#FF9F0A]" />
            <span className="text-xl font-bold text-white">{veri?.puan}</span>
            <span className="text-sm text-[rgba(255,255,255,0.5)]">/10</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderYorumContent = () => {
    const yorumMetni = (veri?.yorumOzet || "").trim();
    const isLongComment = yorumMetni.length > 100;
    const isSpoiler = veri?.spoilerIceriyor === true;

    return (
      <div className="space-y-3">
        <div
          className="flex gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] cursor-pointer hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(108,92,231,0.3)] transition-all"
          onClick={handleContentClick}
        >
          {veri?.posterUrl && (
            <img
              src={veri.posterUrl}
              alt={veri.baslik}
              className="w-20 h-28 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white line-clamp-2">
              {veri?.baslik}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              {getTurIcon(veri?.tur)}
              <span className="text-xs text-[rgba(255,255,255,0.5)] capitalize">
                {veri?.tur}
              </span>
            </div>
          </div>
        </div>
        {yorumMetni && (
          <div
            className={`relative p-4 rounded-xl border-l-2 overflow-hidden transition-all duration-300 ${
              isSpoiler
                ? "bg-gradient-to-r from-[rgba(255,107,107,0.08)] to-[rgba(255,107,107,0.02)] border-[#ff6b6b]/60"
                : "bg-[rgba(108,92,231,0.1)] border-[#6C5CE7]"
            }`}
          >
            {isSpoiler && !spoilerAcik ? (
              <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  setSpoilerAcik(true);
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[rgba(255,107,107,0.15)]">
                    <AlertTriangle size={14} className="text-[#ff6b6b]" />
                  </div>
                  <div>
                    <span className="text-white/90 text-sm font-medium">
                      Spoiler İçeriyor
                    </span>
                    <p className="text-white/40 text-xs mt-0.5">
                      İçeriği görmek için tıklayın
                    </p>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.2)] text-[#ff6b6b] text-xs font-medium hover:bg-[rgba(255,107,107,0.2)] transition-all group-hover:scale-105">
                  Göster
                </button>
              </div>
            ) : (
              <>
                {isSpoiler && (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-[#ff6b6b]/70" />
                      <span className="text-[#ff6b6b]/70 text-xs font-medium uppercase tracking-wide">
                        Spoiler
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSpoilerAcik(false);
                      }}
                      className="text-xs text-white/30 hover:text-white/60 transition-colors"
                    >
                      Gizle
                    </button>
                  </div>
                )}
                <p className="text-[rgba(255,255,255,0.85)] text-sm italic break-words whitespace-pre-wrap leading-relaxed">
                  "
                  {isLongComment
                    ? yorumMetni.substring(0, 150) + "..."
                    : yorumMetni}
                  "
                </p>
                {isLongComment && (
                  <button
                    onClick={handleContentClick}
                    className="mt-2 text-xs text-[#6C5CE7] hover:text-[#00CEC9] transition-colors"
                  >
                    ...daha fazlasını oku
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDurumContent = () => {
    // devam_ediyor durumunu içerik türüne göre İzleniyor/Okunuyor olarak göster
    const durumLabel =
      veri?.durum?.toLowerCase() === "devam_ediyor"
        ? veri?.tur === "kitap"
          ? "Okunuyor"
          : "İzleniyor"
        : veri?.durum;

    const durumConfig: Record<string, { color: string; bg: string }> = {
      izlendi: { color: "#00b894", bg: "rgba(0, 184, 148, 0.15)" },
      izlenecek: { color: "#6C5CE7", bg: "rgba(108, 92, 231, 0.15)" },
      okundu: { color: "#00b894", bg: "rgba(0, 184, 148, 0.15)" },
      okunacak: { color: "#6C5CE7", bg: "rgba(108, 92, 231, 0.15)" },
      izleniyor: { color: "#FF9F0A", bg: "rgba(255, 159, 10, 0.15)" },
      okunuyor: { color: "#FF9F0A", bg: "rgba(255, 159, 10, 0.15)" },
    };
    const config = durumConfig[durumLabel?.toLowerCase() || ""] || {
      color: "#8E8E93",
      bg: "rgba(142, 142, 147, 0.15)",
    };
    return (
      <div
        className="flex gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] cursor-pointer hover:bg-[rgba(255,255,255,0.06)] transition-all"
        onClick={handleContentClick}
      >
        {veri?.posterUrl && (
          <img
            src={veri.posterUrl}
            alt={veri.baslik}
            className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white line-clamp-2">
            {veri?.baslik}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            {getTurIcon(veri?.tur)}
            <span className="text-xs text-[rgba(255,255,255,0.5)] capitalize">
              {veri?.tur}
            </span>
          </div>
          <div className="mt-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              <Play size={12} />
              {durumLabel}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderListeContent = () => (
    <div
      className="flex gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] cursor-pointer hover:bg-[rgba(255,255,255,0.06)] transition-all"
      onClick={handleContentClick}
    >
      {veri?.posterUrl && (
        <img
          src={veri.posterUrl}
          alt={veri.baslik}
          className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white line-clamp-2">
          {veri?.baslik}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          {getTurIcon(veri?.tur)}
          <span className="text-xs text-[rgba(255,255,255,0.5)] capitalize">
            {veri?.tur}
          </span>
        </div>
        {veri?.listeAdi && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[rgba(253,121,168,0.15)] text-[#fd79a8]">
              <List size={12} />
              {veri.listeAdi}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderTakipContent = () => (
    <div
      className="flex items-center gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] cursor-pointer hover:bg-[rgba(255,255,255,0.06)] transition-all"
      onClick={() => navigate(`/profil/${veri?.takipEdilenKullaniciAdi}`)}
    >
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00b894] to-[#00CEC9] flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-[rgba(0,206,201,0.3)]">
        {veri?.takipEdilenAvatar ? (
          <img
            src={veri.takipEdilenAvatar}
            alt={veri.takipEdilenKullaniciAdi}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-bold text-xl">
            {veri?.takipEdilenKullaniciAdi?.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-white">
          @{veri?.takipEdilenKullaniciAdi}
        </p>
        <p className="text-sm text-[rgba(255,255,255,0.5)]">
          Profili görüntüle
        </p>
      </div>
      <UserPlus size={20} className="text-[#00CEC9]" />
    </div>
  );

  const renderMainContent = () => {
    switch (aktiviteTuru.toLowerCase()) {
      case "puanlama":
        return renderPuanlamaContent();
      case "yorum":
        return renderYorumContent();
      case "durum_guncelleme":
        return renderDurumContent();
      case "listeye_ekleme":
      case "kutuphaneyeekleme":
        return renderListeContent();
      case "takip":
      case "takipetme":
        return renderTakipContent();
      default:
        return null;
    }
  };

  return (
    <NebulaCard className="animate-fade-in hover:border-[rgba(108,92,231,0.2)] transition-all">
      <div className="flex items-start gap-3 mb-4">
        {showUserInfo ? (
          <div
            className="p-0.5 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#fd79a8] cursor-pointer"
            onClick={handleProfileClick}
          >
            <div className="w-10 h-10 rounded-full bg-[#0a0a12] flex items-center justify-center overflow-hidden">
              {kullaniciAvatar ? (
                <img
                  src={kullaniciAvatar}
                  alt={kullaniciAdi}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {kullaniciAdi?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.05)]">
            {aktiviteTuru.toLowerCase() === "puanlama" && (
              <Star size={16} className="text-[#FF9F0A]" />
            )}
            {aktiviteTuru.toLowerCase() === "yorum" && (
              <MessageCircle size={16} className="text-[#6C5CE7]" />
            )}
            {(aktiviteTuru.toLowerCase() === "listeye_ekleme" ||
              aktiviteTuru.toLowerCase() === "kutuphaneyeekleme") && (
              <List size={16} className="text-[#00CEC9]" />
            )}
            {(aktiviteTuru.toLowerCase() === "takip" ||
              aktiviteTuru.toLowerCase() === "takipetme") && (
              <UserPlus size={16} className="text-[#00b894]" />
            )}
            {aktiviteTuru.toLowerCase() === "durum_guncelleme" && (
              <Play size={16} className="text-[#74b9ff]" />
            )}
            {aktiviteTuru.toLowerCase() === "listeolusturma" && (
              <List size={16} className="text-[#fd79a8]" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            {showUserInfo && (
              <span
                className="font-semibold text-white cursor-pointer hover:text-[#6C5CE7] transition-colors"
                onClick={handleProfileClick}
              >
                {kullaniciAdi}
              </span>
            )}
            <span className="text-[rgba(255,255,255,0.5)]">
              {showUserInfo ? " " : ""}
              {getAksiyonMetni()}
            </span>
          </p>
          <p className="text-xs text-[rgba(255,255,255,0.35)] mt-0.5">
            {tarihStr}
          </p>
        </div>
        {isOwnProfile && onDelete && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[#8E8E93]"
            >
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[#1C1C1E] rounded-xl shadow-lg border border-white/10 overflow-hidden z-10 min-w-[140px]">
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2.5 text-sm text-[#fd79a8] hover:bg-white/5 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Sil
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mb-4">{renderMainContent()}</div>
      <div className="flex items-center gap-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <button
          onClick={handleBegeni}
          disabled={begeniYukleniyor || !isLoggedIn}
          className={`flex items-center gap-2 text-sm transition-all disabled:opacity-50 ${
            begendim
              ? "text-[#fd79a8]"
              : "text-[rgba(255,255,255,0.5)] hover:text-[#fd79a8]"
          }`}
        >
          <Heart size={18} className={begendim ? "fill-[#fd79a8]" : ""} />
          <span>{begeniSayisi > 0 ? begeniSayisi : "Beğen"}</span>
        </button>
        <button
          onClick={toggleYorumlar}
          className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] hover:text-[#6C5CE7] transition-colors"
        >
          <MessageCircle size={18} />
          <span>{yorumSayisi > 0 ? `${yorumSayisi} Yorum` : "Yorum Yap"}</span>
          {yorumlarAcik ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {yorumlarAcik && (
        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          {isLoggedIn && (
            <div className="mb-4">
              {yanitYapilan && (
                <div className="flex items-center gap-2 mb-2 text-xs text-[#6C5CE7]">
                  <span>Yanıtlanıyor:</span>
                  <button
                    onClick={() => setYanitYapilan(null)}
                    className="hover:underline"
                  >
                    İptal
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={yeniYorum}
                  onChange={(e) => setYeniYorum(e.target.value)}
                  placeholder={
                    yanitYapilan ? "Yanıtınızı yazın..." : "Yorum yazın..."
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-white text-sm placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 transition-all"
                  onKeyPress={(e) => e.key === "Enter" && handleYorumGonder()}
                />
                <button
                  onClick={handleYorumGonder}
                  disabled={!yeniYorum.trim() || yorumGonderiliyor}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] text-white disabled:opacity-50 hover:shadow-lg hover:shadow-[#6C5CE7]/30 transition-all"
                >
                  {yorumGonderiliyor ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          )}
          {yorumlarYukleniyor ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-[#6C5CE7]" />
            </div>
          ) : yorumlar.length > 0 ? (
            <div className="space-y-3">
              {yorumlar.map((yorum) => (
                <YorumItem
                  key={yorum.id}
                  yorum={yorum}
                  isLoggedIn={isLoggedIn}
                  onYanitla={() => setYanitYapilan(yorum.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-[rgba(255,255,255,0.35)] py-4">
              Henüz yorum yok. İlk yorumu siz yapın!
            </p>
          )}
        </div>
      )}
    </NebulaCard>
  );
}

export default ActivityCard;
