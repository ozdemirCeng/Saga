import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2, Sparkles, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../services/supabase";

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
  showPasswordToggle,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  required?: boolean;
  showPasswordToggle?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]">
          {icon}
        </div>
      )}
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-3.5 rounded-xl text-white text-sm bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 focus:border-transparent placeholder:text-[rgba(255,255,255,0.4)] transition-all ${
          icon ? "pl-12" : ""
        } ${showPasswordToggle ? "pr-12" : ""}`}
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)] transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate("/");
    } catch (err: any) {
      // Hata mesajlarını Türkçeleştir
      let errorMessage = "Giriş yapılırken hata oluştu.";
      if (err.message) {
        if (err.message.includes("Invalid login credentials")) {
          errorMessage = "E-posta veya şifre hatalı. Lütfen tekrar deneyin.";
        } else if (err.message.includes("Email not confirmed")) {
          errorMessage =
            "E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızı kontrol edin.";
        } else if (err.message.includes("Too many requests")) {
          errorMessage = "Çok fazla deneme yaptınız. Lütfen biraz bekleyin.";
        } else if (err.message.includes("Network")) {
          errorMessage = "Bağlantı hatası. İnternet bağlantınızı kontrol edin.";
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(108, 92, 231, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(0, 206, 201, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(253, 121, 168, 0.05) 0%, transparent 70%),
          linear-gradient(180deg, #0a0a12 0%, #0f0f1a 100%)
        `,
      }}
    >
      {/* Floating orbs */}
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
          Hoş Geldiniz
        </h1>
        <p className="text-[rgba(255,255,255,0.5)] text-sm mb-8">
          Nebula'ya giriş yapın ve keşfetmeye başlayın.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[rgba(253,121,168,0.15)] text-[#fd79a8] text-sm border border-[rgba(253,121,168,0.2)]">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <NebulaInput
            type="email"
            placeholder="E-posta Adresi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            required
          />

          <NebulaInput
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={18} />}
            required
            showPasswordToggle
          />

          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3.5 mt-2
              bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white
              font-semibold text-sm
              rounded-xl
              shadow-lg shadow-[#6C5CE7]/25
              hover:shadow-xl hover:shadow-[#6C5CE7]/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300
              active:scale-[0.98]
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Giriş Yapılıyor...
              </>
            ) : (
              "Giriş Yap"
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/kayit")}
            className="
              w-full py-3.5
              bg-[rgba(255,255,255,0.05)] text-white
              font-semibold text-sm
              rounded-xl
              border border-[rgba(255,255,255,0.1)]
              hover:bg-[rgba(255,255,255,0.1)]
              transition-all duration-200
              active:scale-[0.98]
            "
          >
            Hesap Oluştur
          </button>
        </form>

        <button
          onClick={() => navigate("/sifremi-unuttum")}
          className="mt-6 text-sm text-[rgba(255,255,255,0.5)] hover:text-[#6C5CE7] transition-colors cursor-pointer bg-transparent border-none"
        >
          Şifremi Unuttum
        </button>
      </NebulaCard>
    </div>
  );
}
