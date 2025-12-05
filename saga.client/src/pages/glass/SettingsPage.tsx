import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  LogOut,
  Trash2,
  Bell,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Camera,
  AlertTriangle,
  Check,
  ChevronRight,
  Upload,
  Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { kullaniciApi, ayarlarApi, authApi } from "../../services/api";
import { supabase } from "../../services/supabase";

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

function GlassPanel({
  children,
  className = "",
  padding = "md",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}) {
  const paddings = { sm: "p-3", md: "p-5", lg: "p-6" };
  return (
    <div
      className={`rounded-2xl bg-[rgba(30,30,50,0.5)] backdrop-blur-xl border border-[rgba(255,255,255,0.06)] ${paddings[padding]} ${className}`}
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
  variant?: "primary" | "secondary" | "ghost" | "success" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
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
    success: "bg-[#00b894] text-white hover:bg-[#00b894]/80",
    danger: "bg-[#fd79a8] text-white hover:bg-[#fd79a8]/80",
  };
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
    icon: "w-10 h-10 p-0",
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

type SettingsTab = "profil" | "guvenlik" | "bildirimler" | "hesap";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profil");

  // Profil state
  const [profilForm, setProfilForm] = useState({
    goruntulemeAdi: user?.goruntulemeAdi || user?.kullaniciAdi || "",
    biyografi: "",
    avatarUrl: user?.profilResmi || "",
  });
  const [profilLoading, setProfilLoading] = useState(false);
  const [profilSuccess, setProfilSuccess] = useState(false);

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Şifre state
  const [sifreForm, setSifreForm] = useState({
    eskiSifre: "",
    yeniSifre: "",
    yeniSifreTekrar: "",
  });
  const [sifreLoading, setSifreLoading] = useState(false);
  const [sifreError, setSifreError] = useState("");
  const [sifreSuccess, setSifreSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    eski: false,
    yeni: false,
    tekrar: false,
  });

  // Bildirim state - API'den yüklenecek
  const [bildirimAyarlari, setBildirimAyarlari] = useState({
    yeniTakipci: true,
    yorumlar: true,
    begeniler: true,
    oneriler: false,
    emailBildirimleri: false,
  });
  const [ayarlarLoading, setAyarlarLoading] = useState(false);
  const [ayarlarSaving, setAyarlarSaving] = useState(false);

  // Modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Ayarları API'den yükle
  useEffect(() => {
    const loadAyarlar = async () => {
      if (!user) return;

      setAyarlarLoading(true);
      try {
        const ayarlar = await ayarlarApi.getAyarlar();
        setBildirimAyarlari({
          yeniTakipci: ayarlar.bildirimYeniTakipci,
          yorumlar: ayarlar.bildirimYorumlar,
          begeniler: ayarlar.bildirimBegeniler,
          oneriler: ayarlar.bildirimOneriler,
          emailBildirimleri: ayarlar.bildirimEmail,
        });
      } catch (err) {
        console.error("Ayarlar yüklenirken hata:", err);
      } finally {
        setAyarlarLoading(false);
      }
    };

    loadAyarlar();
  }, [user]);

  // Bildirim ayarlarını güncelle
  const handleBildirimToggle = async (key: string) => {
    const newValue = !bildirimAyarlari[key as keyof typeof bildirimAyarlari];
    setBildirimAyarlari({
      ...bildirimAyarlari,
      [key]: newValue,
    });

    setAyarlarSaving(true);
    try {
      // API key mapping
      const apiKeyMap: Record<string, string> = {
        yeniTakipci: "bildirimYeniTakipci",
        yorumlar: "bildirimYorumlar",
        begeniler: "bildirimBegeniler",
        oneriler: "bildirimOneriler",
        emailBildirimleri: "bildirimEmail",
      };

      await ayarlarApi.updateBildirimler({ [apiKeyMap[key]]: newValue });
    } catch (err) {
      console.error("Bildirim ayarı güncellenirken hata:", err);
      // Hata durumunda eski değeri geri yükle
      setBildirimAyarlari({
        ...bildirimAyarlari,
        [key]: !newValue,
      });
    } finally {
      setAyarlarSaving(false);
    }
  };

  // Avatar yükleme fonksiyonu
  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Dosya boyutu kontrolü (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Dosya boyutu 2MB'dan küçük olmalıdır.");
      return;
    }

    // Dosya türü kontrolü
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError("Sadece JPEG, PNG, GIF veya WEBP dosyaları yüklenebilir.");
      return;
    }

    setAvatarUploading(true);
    setAvatarError("");

    try {
      // Dosya adını oluştur (userId + timestamp)
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      // Bucket adı 'avatars', dosya doğrudan root'a yüklenir
      const filePath = fileName;

      // Supabase Storage'a yükle
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("Dosya yüklenirken bir hata oluştu.");
      }

      // Public URL'yi al
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // State'i güncelle
      setProfilForm({ ...profilForm, avatarUrl });

      // Backend'e de kaydet
      await kullaniciApi.updateProfil({ avatarUrl });

      setProfilSuccess(true);
      setTimeout(() => setProfilSuccess(false), 3000);
    } catch (err: unknown) {
      console.error("Avatar yükleme hatası:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Avatar yüklenirken bir hata oluştu.";
      setAvatarError(errorMessage);
    } finally {
      setAvatarUploading(false);
      // Input'u temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Profil güncelle
  const handleUpdateProfil = async () => {
    setProfilLoading(true);
    setProfilSuccess(false);
    try {
      const updateData: {
        goruntulemeAdi?: string;
        biyografi?: string;
        avatarUrl?: string;
      } = {
        goruntulemeAdi: profilForm.goruntulemeAdi || undefined,
        biyografi: profilForm.biyografi || undefined,
      };
      // Sadece geçerli URL varsa gönder (boş string URL validation hatası verir)
      if (profilForm.avatarUrl && profilForm.avatarUrl.trim()) {
        updateData.avatarUrl = profilForm.avatarUrl;
      }
      await kullaniciApi.updateProfil(updateData);
      setProfilSuccess(true);
      setTimeout(() => setProfilSuccess(false), 3000);
    } catch (err) {
      console.error("Profil güncelleme hatası:", err);
    } finally {
      setProfilLoading(false);
    }
  };

  // Şifre değiştir
  const handleChangePassword = async () => {
    setSifreError("");
    setSifreSuccess(false);

    if (sifreForm.yeniSifre !== sifreForm.yeniSifreTekrar) {
      setSifreError("Yeni şifreler eşleşmiyor.");
      return;
    }

    if (sifreForm.yeniSifre.length < 6) {
      setSifreError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setSifreLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: sifreForm.yeniSifre,
      });

      if (error) throw error;

      setSifreSuccess(true);
      setSifreForm({ eskiSifre: "", yeniSifre: "", yeniSifreTekrar: "" });
      setTimeout(() => setSifreSuccess(false), 3000);
    } catch (err: any) {
      setSifreError(err.message || "Şifre değiştirirken bir hata oluştu.");
    } finally {
      setSifreLoading(false);
    }
  };

  // Çıkış yap
  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Hesap sil
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError("");

    try {
      // Backend'de hesabı sil (soft delete)
      await authApi.deleteAccount();

      // Supabase oturumunu kapat
      await signOut();

      // Ana sayfaya yönlendir
      navigate("/");
    } catch (err: any) {
      console.error("Hesap silme hatası:", err);
      setDeleteError(
        err.response?.data?.message || "Hesap silinirken bir hata oluştu."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { id: "profil" as SettingsTab, label: "Profil", icon: User },
    { id: "guvenlik" as SettingsTab, label: "Güvenlik", icon: Lock },
    { id: "bildirimler" as SettingsTab, label: "Bildirimler", icon: Bell },
    { id: "hesap" as SettingsTab, label: "Hesap", icon: AlertTriangle },
  ];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-0">
        <GlassCard className="text-center py-12">
          <User size={48} className="mx-auto mb-4 text-[#8E8E93]" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Giriş Yapmalısınız
          </h2>
          <p className="text-[#8E8E93] mb-6">
            Ayarları görüntülemek için giriş yapın.
          </p>
          <Button onClick={() => navigate("/giris")}>Giriş Yap</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-0">
      {/* Header - Modern */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a29bfe] to-[#6C5CE7] flex items-center justify-center shadow-lg shadow-[#6C5CE7]/20">
          <Settings size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Ayarlar</h1>
          <p className="text-xs text-[rgba(255,255,255,0.5)]">
            Hesap ve tercihler
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <GlassCard className="p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#6C5CE7] text-white"
                    : "text-[#8E8E93] hover:bg-white/5"
                }`}
              >
                <tab.icon size={20} />
                <span className="font-medium">{tab.label}</span>
                <ChevronRight size={16} className="ml-auto opacity-50" />
              </button>
            ))}
          </GlassCard>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profil Tab */}
          {activeTab === "profil" && (
            <GlassCard>
              <h2 className="text-xl font-semibold text-white mb-6">
                Profil Bilgileri
              </h2>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center overflow-hidden">
                    {avatarUploading ? (
                      <Loader2 size={24} className="text-white animate-spin" />
                    ) : profilForm.avatarUrl ? (
                      <img
                        src={profilForm.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-2xl font-bold">
                        {user.kullaniciAdi?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#6C5CE7] text-white hover:bg-[#5B4CD9] transition-colors disabled:opacity-50"
                    title="Fotoğraf Yükle"
                  >
                    {avatarUploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Camera size={14} />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{user.kullaniciAdi}</p>
                  <p className="text-sm text-[#8E8E93]">{user.email}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="mt-2 text-xs text-[#6C5CE7] hover:text-[#a29bfe] flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Upload size={12} />
                    {avatarUploading ? "Yükleniyor..." : "Fotoğraf Yükle"}
                  </button>
                  {avatarError && (
                    <p className="text-xs text-red-400 mt-1">{avatarError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Kullanıcı Adı (readonly) */}
                <div>
                  <label className="block text-sm text-[#8E8E93] mb-2">
                    Kullanıcı Adı
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636366]"
                    />
                    <input
                      type="text"
                      value={user.kullaniciAdi}
                      disabled
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#636366] cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-[#636366] mt-1">
                    Kullanıcı adı değiştirilemez.
                  </p>
                </div>

                {/* E-posta (readonly) */}
                <div>
                  <label className="block text-sm text-[#8E8E93] mb-2">
                    E-posta
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636366]"
                    />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#636366] cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Görüntüleme Adı */}
                <div>
                  <label className="block text-sm text-[#8E8E93] mb-2">
                    Görüntüleme Adı
                  </label>
                  <input
                    type="text"
                    value={profilForm.goruntulemeAdi}
                    onChange={(e) =>
                      setProfilForm({
                        ...profilForm,
                        goruntulemeAdi: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#636366] focus:outline-none focus:border-[#6C5CE7]"
                    placeholder="Görüntüleme adınız"
                  />
                </div>

                {/* Biyografi */}
                <div>
                  <label className="block text-sm text-[#8E8E93] mb-2">
                    Biyografi
                  </label>
                  <textarea
                    value={profilForm.biyografi}
                    onChange={(e) =>
                      setProfilForm({
                        ...profilForm,
                        biyografi: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#636366] focus:outline-none focus:border-[#6C5CE7] resize-none h-24"
                    placeholder="Kendiniz hakkında birkaç şey yazın..."
                  />
                </div>

                {/* Kaydet */}
                <div className="flex items-center gap-3 pt-4">
                  <Button onClick={handleUpdateProfil} disabled={profilLoading}>
                    {profilLoading ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : profilSuccess ? (
                      <Check size={16} className="mr-2" />
                    ) : (
                      <Save size={16} className="mr-2" />
                    )}
                    {profilSuccess ? "Kaydedildi!" : "Değişiklikleri Kaydet"}
                  </Button>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Güvenlik Tab */}
          {activeTab === "guvenlik" && (
            <GlassCard>
              <h2 className="text-xl font-semibold text-white mb-6">
                Şifre Değiştir
              </h2>

              <div className="space-y-4">
                {/* Yeni Şifre */}
                <div>
                  <label className="block text-sm text-[#8E8E93] mb-2">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636366]"
                    />
                    <input
                      type={showPasswords.yeni ? "text" : "password"}
                      value={sifreForm.yeniSifre}
                      onChange={(e) =>
                        setSifreForm({
                          ...sifreForm,
                          yeniSifre: e.target.value,
                        })
                      }
                      className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#636366] focus:outline-none focus:border-[#6C5CE7]"
                      placeholder="En az 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          yeni: !showPasswords.yeni,
                        })
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636366] hover:text-white"
                    >
                      {showPasswords.yeni ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Yeni Şifre Tekrar */}
                <div>
                  <label className="block text-sm text-[#8E8E93] mb-2">
                    Yeni Şifre (Tekrar)
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636366]"
                    />
                    <input
                      type={showPasswords.tekrar ? "text" : "password"}
                      value={sifreForm.yeniSifreTekrar}
                      onChange={(e) =>
                        setSifreForm({
                          ...sifreForm,
                          yeniSifreTekrar: e.target.value,
                        })
                      }
                      className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-[#636366] focus:outline-none focus:border-[#6C5CE7]"
                      placeholder="Şifreyi tekrar girin"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          tekrar: !showPasswords.tekrar,
                        })
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636366] hover:text-white"
                    >
                      {showPasswords.tekrar ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Hata/Başarı mesajı */}
                {sifreError && (
                  <div className="p-3 rounded-xl bg-[#fd79a8]/20 text-[#fd79a8] text-sm">
                    {sifreError}
                  </div>
                )}
                {sifreSuccess && (
                  <div className="p-3 rounded-xl bg-[#00b894]/20 text-[#00b894] text-sm">
                    Şifreniz başarıyla değiştirildi!
                  </div>
                )}

                {/* Kaydet */}
                <div className="pt-4">
                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      sifreLoading ||
                      !sifreForm.yeniSifre ||
                      !sifreForm.yeniSifreTekrar
                    }
                  >
                    {sifreLoading ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Lock size={16} className="mr-2" />
                    )}
                    Şifreyi Değiştir
                  </Button>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Bildirimler Tab */}
          {activeTab === "bildirimler" && (
            <GlassCard>
              <h2 className="text-xl font-semibold text-white mb-6">
                Bildirim Tercihleri
              </h2>

              {ayarlarLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-[#6C5CE7]" />
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    {
                      key: "yeniTakipci",
                      label: "Yeni takipçi bildirimleri",
                      desc: "Biri sizi takip ettiğinde bildirim alın",
                    },
                    {
                      key: "yorumlar",
                      label: "Yorum bildirimleri",
                      desc: "Yorumlarınıza yanıt geldiğinde bildirim alın",
                    },
                    {
                      key: "begeniler",
                      label: "Beğeni bildirimleri",
                      desc: "İçeriğiniz beğenildiğinde bildirim alın",
                    },
                    {
                      key: "oneriler",
                      label: "Öneri bildirimleri",
                      desc: "Size özel içerik önerileri alın",
                    },
                    {
                      key: "emailBildirimleri",
                      label: "E-posta bildirimleri",
                      desc: "Önemli güncellemeleri e-posta ile alın",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                    >
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-sm text-[#8E8E93]">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleBildirimToggle(item.key)}
                        disabled={ayarlarSaving}
                        className={`w-14 h-8 rounded-full transition-colors relative disabled:opacity-50 flex items-center ${
                          bildirimAyarlari[
                            item.key as keyof typeof bildirimAyarlari
                          ]
                            ? "bg-[#00b894]"
                            : "bg-[#636366]"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                            bildirimAyarlari[
                              item.key as keyof typeof bildirimAyarlari
                            ]
                              ? "translate-x-7"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}

          {/* Hesap Tab */}
          {activeTab === "hesap" && (
            <div className="space-y-6">
              {/* Çıkış Yap */}
              <GlassCard>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Oturum
                </h2>
                <p className="text-[#8E8E93] mb-4">
                  Hesabınızdan çıkış yapın. Tekrar giriş yapana kadar içerik
                  ekleyemez ve yorum yapamazsınız.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => setShowLogoutModal(true)}
                >
                  <LogOut size={16} className="mr-2" />
                  Çıkış Yap
                </Button>
              </GlassCard>

              {/* Tehlikeli Bölge */}
              <GlassPanel className="border border-[#fd79a8]/30">
                <h2 className="text-xl font-semibold text-[#fd79a8] mb-4">
                  Tehlikeli Bölge
                </h2>
                <p className="text-[#8E8E93] mb-4">
                  Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak
                  silinecektir. Bu işlem geri alınamaz.
                </p>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 size={16} className="mr-2" />
                  Hesabı Sil
                </Button>
              </GlassPanel>
            </div>
          )}
        </div>
      </div>

      {/* Çıkış Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#f39c12]/20 flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} className="text-[#f39c12]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Çıkış Yap
              </h3>
              <p className="text-[#8E8E93] mb-6">
                Hesabınızdan çıkış yapmak istediğinize emin misiniz?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowLogoutModal(false)}
                >
                  İptal
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleLogout}
                >
                  Çıkış Yap
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Hesap Silme Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#fd79a8]/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-[#fd79a8]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Hesabı Sil
              </h3>
              <p className="text-[#8E8E93] mb-4">
                Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak
                silinecektir.
              </p>

              {deleteError && (
                <div className="mb-4 p-3 rounded-xl bg-[#fd79a8]/20 text-[#fd79a8] text-sm">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteError("");
                  }}
                  disabled={deleteLoading}
                >
                  İptal
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Siliniyor...
                    </>
                  ) : (
                    "Hesabı Sil"
                  )}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
