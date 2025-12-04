import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Lock,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { authApi } from "../../services/api";

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
      className={`p-8 rounded-2xl bg-[rgba(20,20,35,0.75)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const navigate = useNavigate();

  // URL'den token'ı al
  const token =
    searchParams.get("access_token") || searchParams.get("token") || "";

  useEffect(() => {
    // Debug: Token ve URL'yi konsola yaz
    console.log("=== RESET PAGE ===");
    console.log("Token:", token);
    setTokenChecked(true);
  }, [token, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (!token) {
      setError(
        "Geçersiz veya eksik token. Lütfen şifre sıfırlama linkini tekrar kullanın."
      );
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        token,
        yeniSifre: password,
        yeniSifreTekrar: confirmPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Şifre sıfırlama başarısız. Token süresi dolmuş olabilir."
      );
    } finally {
      setLoading(false);
    }
  };

  const backgroundStyle = {
    background: `
      radial-gradient(ellipse at 20% 0%, rgba(108, 92, 231, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(0, 206, 201, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(253, 121, 168, 0.05) 0%, transparent 70%),
      linear-gradient(180deg, #0a0a12 0%, #0f0f1a 100%)
    `,
  };

  // Token yoksa ve kontrol tamamlandıysa hata göster
  if (!token && tokenChecked && !success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={backgroundStyle}
      >
        <div className="fixed top-20 left-20 w-64 h-64 rounded-full bg-[#fd79a8]/10 blur-3xl animate-float" />
        <div
          className="fixed bottom-20 right-20 w-80 h-80 rounded-full bg-[#6C5CE7]/10 blur-3xl animate-float"
          style={{ animationDelay: "-3s" }}
        />

        <NebulaCard className="w-full max-w-[420px] text-center animate-scale-in relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#fd79a8]/20 flex items-center justify-center">
            <AlertTriangle size={32} className="text-[#fd79a8]" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3 font-['Outfit']">
            Geçersiz Link
          </h1>
          <p className="text-[rgba(255,255,255,0.5)] text-sm mb-6">
            Şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeni bir
            şifre sıfırlama talebi oluşturun.
          </p>

          <Link
            to="/sifremi-unuttum"
            className="w-full py-3.5 bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#6C5CE7]/25 hover:shadow-xl hover:shadow-[#6C5CE7]/30 transition-all duration-300 active:scale-[0.98] flex items-center justify-center"
          >
            Yeni Şifre Sıfırlama Talebi
          </Link>

          <Link
            to="/giris"
            className="mt-4 text-sm text-[rgba(255,255,255,0.5)] hover:text-[#6C5CE7] transition-colors block"
          >
            Giriş Sayfasına Dön
          </Link>
        </NebulaCard>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={backgroundStyle}
      >
        <div className="fixed top-20 left-20 w-64 h-64 rounded-full bg-[#00b894]/10 blur-3xl animate-float" />
        <div
          className="fixed bottom-20 right-20 w-80 h-80 rounded-full bg-[#6C5CE7]/10 blur-3xl animate-float"
          style={{ animationDelay: "-3s" }}
        />

        <NebulaCard className="w-full max-w-[420px] text-center animate-scale-in relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#00b894]/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-[#00b894]" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3 font-['Outfit']">
            Şifre Güncellendi
          </h1>
          <p className="text-[rgba(255,255,255,0.5)] text-sm mb-6">
            Şifreniz başarıyla değiştirildi. Artık yeni şifrenizle giriş
            yapabilirsiniz.
          </p>

          <button
            onClick={() => navigate("/giris")}
            className="w-full py-3.5 bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#6C5CE7]/25 hover:shadow-xl hover:shadow-[#6C5CE7]/30 transition-all duration-300 active:scale-[0.98]"
          >
            Giriş Yap
          </button>
        </NebulaCard>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={backgroundStyle}
    >
      <div className="fixed top-20 left-20 w-64 h-64 rounded-full bg-[#6C5CE7]/10 blur-3xl animate-float" />
      <div
        className="fixed bottom-20 right-20 w-80 h-80 rounded-full bg-[#00CEC9]/10 blur-3xl animate-float"
        style={{ animationDelay: "-3s" }}
      />

      <NebulaCard className="w-full max-w-[420px] text-center animate-scale-in relative z-10">
        {/* Logo */}
        <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#a29bfe] flex items-center justify-center shadow-lg shadow-[#6C5CE7]/25 animate-pulse-glow">
          <Sparkles size={28} className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 font-['Outfit']">
          Yeni Şifre Belirle
        </h1>
        <p className="text-[rgba(255,255,255,0.5)] text-sm mb-8">
          Hesabınız için yeni bir şifre belirleyin.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[rgba(253,121,168,0.15)] text-[#fd79a8] text-sm border border-[rgba(253,121,168,0.2)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Yeni Şifre */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Yeni Şifre (en az 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.4)] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Şifre Tekrar */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]">
              <Lock size={18} />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Şifre Tekrar"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.4)] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] hover:text-white"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#6C5CE7]/25 hover:shadow-xl hover:shadow-[#6C5CE7]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Şifre Güncelleniyor...
              </>
            ) : (
              "Şifreyi Güncelle"
            )}
          </button>

          <Link
            to="/giris"
            className="w-full py-3.5 bg-[rgba(255,255,255,0.05)] text-white font-semibold text-sm rounded-xl border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Giriş Sayfasına Dön
          </Link>
        </form>
      </NebulaCard>
    </div>
  );
}
