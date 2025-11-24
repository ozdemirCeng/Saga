using System.ComponentModel.DataAnnotations;

namespace Saga.Server.DTOs
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "Kullanıcı adı gereklidir")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Kullanıcı adı 3-50 karakter arasında olmalıdır")]
        public string KullaniciAdi { get; set; } = string.Empty;

        [Required(ErrorMessage = "E-posta gereklidir")]
        [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz")]
        public string Eposta { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre gereklidir")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifre en az 6 karakter olmalıdır")]
        public string Sifre { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre tekrarı gereklidir")]
        [Compare("Sifre", ErrorMessage = "Şifreler eşleşmiyor")]
        public string SifreTekrar { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        [Required(ErrorMessage = "E-posta gereklidir")]
        [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz")]
        public string Eposta { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre gereklidir")]
        public string Sifre { get; set; } = string.Empty;
    }

    public class ForgotPasswordDto
    {
        [Required(ErrorMessage = "E-posta gereklidir")]
        [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz")]
        public string Eposta { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        [Required(ErrorMessage = "Token gereklidir")]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "Yeni şifre gereklidir")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifre en az 6 karakter olmalıdır")]
        public string YeniSifre { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre tekrarı gereklidir")]
        [Compare("YeniSifre", ErrorMessage = "Şifreler eşleşmiyor")]
        public string YeniSifreTekrar { get; set; } = string.Empty;
    }

    public class RefreshTokenDto
    {
        [Required(ErrorMessage = "Refresh token gereklidir")]
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public UserDto? User { get; set; }
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Eposta { get; set; } = string.Empty;
        public string KullaniciAdi { get; set; } = string.Empty;
        public string? GoruntulemeAdi { get; set; }
        public string? AvatarUrl { get; set; }
    }
}