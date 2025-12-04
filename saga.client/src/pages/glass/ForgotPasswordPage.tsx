import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle, Sparkles } from "lucide-react";
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

function NebulaInput({
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  required,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-3.5 rounded-xl text-white text-sm bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 focus:border-transparent placeholder:text-[rgba(255,255,255,0.4)] transition-all ${
          icon ? "pl-12" : ""
        }`}
      />
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Debug log
  console.log("=== FORGOT PAGE ===");
  console.log("Current URL:", window.location.href);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Bir hata oluştu. Lütfen tekrar deneyin."
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
            E-posta Gönderildi
          </h1>
          <p className="text-[rgba(255,255,255,0.5)] text-sm mb-6">
            Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama linki gönderildi.
            Lütfen gelen kutunuzu kontrol edin.
          </p>

          <p className="text-xs text-[rgba(255,255,255,0.3)] mb-6">
            E-posta gelmediyse spam klasörünü kontrol edin.
          </p>

          <button
            onClick={() => navigate("/giris")}
            className="w-full py-3.5 bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#6C5CE7]/25 hover:shadow-xl hover:shadow-[#6C5CE7]/30 transition-all duration-300 active:scale-[0.98]"
          >
            Giriş Sayfasına Dön
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
          Şifremi Unuttum
        </h1>
        <p className="text-[rgba(255,255,255,0.5)] text-sm mb-8">
          E-posta adresinizi girin, size şifre sıfırlama linki gönderelim.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[rgba(253,121,168,0.15)] text-[#fd79a8] text-sm border border-[rgba(253,121,168,0.2)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <NebulaInput
            type="email"
            placeholder="E-posta Adresi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            required
          />

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#6C5CE7]/25 hover:shadow-xl hover:shadow-[#6C5CE7]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              "Şifre Sıfırlama Linki Gönder"
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
