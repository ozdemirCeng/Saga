using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Saga.Server.Data;
using Saga.Server.DTOs;
using Saga.Server.Models;
using Saga.Server.Services;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Saga.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly HttpClient _httpClient;
        private readonly SagaDbContext _context;
        private readonly IEmailService _emailService;
        private readonly string _supabaseUrl;
        private readonly string _supabaseAnonKey;
        private readonly string _supabaseServiceRoleKey;
        private readonly string _frontendUrl;

        public AuthController(
            IConfiguration configuration,
            ILogger<AuthController> logger,
            IHttpClientFactory httpClientFactory,
            SagaDbContext context,
            IEmailService emailService)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            _context = context;
            _emailService = emailService;
            _supabaseUrl = configuration["Supabase:Url"] ?? throw new Exception("Supabase URL bulunamadı!");
            _supabaseAnonKey = configuration["Supabase:AnonKey"] ?? throw new Exception("Supabase Anon Key bulunamadı!");
            _supabaseServiceRoleKey = configuration["Supabase:ServiceRoleKey"] ?? throw new Exception("Supabase Service Role Key bulunamadı!");
            _frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";
        }

        // POST: api/auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto model)
        {
            try
            {
                var requestBody = new
                {
                    email = model.Eposta,
                    password = model.Sifre,
                    data = new
                    {
                        username = model.KullaniciAdi,
                        full_name = model.KullaniciAdi
                    }
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseAnonKey);
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseAnonKey);

                var response = await _httpClient.PostAsync(
                    $"{_supabaseUrl}/auth/v1/signup",
                    content);

                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Supabase kayıt hatası: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    
                    var errorObj = JsonSerializer.Deserialize<JsonElement>(responseContent);
                    var errorMessage = errorObj.TryGetProperty("msg", out var msg) 
                        ? msg.GetString() 
                        : "Kayıt başarısız oldu.";

                    return BadRequest(new { message = errorMessage });
                }

                var authResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                var result = new AuthResponseDto
                {
                    AccessToken = authResponse.GetProperty("access_token").GetString(),
                    RefreshToken = authResponse.GetProperty("refresh_token").GetString(),
                    User = new UserDto
                    {
                        Id = Guid.Parse(authResponse.GetProperty("user").GetProperty("id").GetString()!),
                        Eposta = authResponse.GetProperty("user").GetProperty("email").GetString()!,
                        KullaniciAdi = model.KullaniciAdi
                    }
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kayıt işlemi sırasında hata oluştu");
                return StatusCode(500, new { message = "Kayıt işlemi sırasında bir hata oluştu." });
            }
        }

        // POST: api/auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto model)
        {
            try
            {
                var requestBody = new
                {
                    email = model.Eposta,
                    password = model.Sifre
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseAnonKey);

                var response = await _httpClient.PostAsync(
                    $"{_supabaseUrl}/auth/v1/token?grant_type=password",
                    content);

                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Supabase giriş hatası: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    return Unauthorized(new { message = "E-posta veya şifre hatalı." });
                }

                var authResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                var result = new AuthResponseDto
                {
                    AccessToken = authResponse.GetProperty("access_token").GetString(),
                    RefreshToken = authResponse.GetProperty("refresh_token").GetString(),
                    User = new UserDto
                    {
                        Id = Guid.Parse(authResponse.GetProperty("user").GetProperty("id").GetString()!),
                        Eposta = authResponse.GetProperty("user").GetProperty("email").GetString()!,
                        KullaniciAdi = authResponse.GetProperty("user").GetProperty("user_metadata")
                            .GetProperty("username").GetString() ?? 
                            authResponse.GetProperty("user").GetProperty("email").GetString()!.Split('@')[0]
                    }
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Giriş işlemi sırasında hata oluştu");
                return StatusCode(500, new { message = "Giriş işlemi sırasında bir hata oluştu." });
            }
        }

        // POST: api/auth/forgot-password
        // Şifremi Unuttum - E-posta ile sıfırlama linki gönder
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordDto model)
        {
            try
            {
                // Kullanıcıyı bul
                var kullanici = await _context.Kullanicilar
                    .FirstOrDefaultAsync(k => k.Eposta.ToLower() == model.Eposta.ToLower());

                // Güvenlik: Kullanıcı bulunamasa bile başarılı mesaj dön
                if (kullanici == null)
                {
                    _logger.LogWarning("Şifre sıfırlama talebi: E-posta bulunamadı - {Eposta}", model.Eposta);
                    return Ok(new { message = "Eğer e-posta kayıtlıysa, şifre sıfırlama linki gönderildi." });
                }

                // Eski tokenları iptal et
                var eskiTokenlar = await _context.SifreSifirlamaTokenlari
                    .Where(t => t.KullaniciId == kullanici.Id && !t.Kullanildi)
                    .ToListAsync();
                
                foreach (var token in eskiTokenlar)
                {
                    token.Kullanildi = true;
                    token.KullanilmaZamani = DateTime.UtcNow;
                }

                // Yeni token oluştur
                var resetToken = GenerateSecureToken();
                var tokenEntity = new SifreSifirlamaToken
                {
                    KullaniciId = kullanici.Id,
                    Token = resetToken,
                    Eposta = kullanici.Eposta,
                    OlusturulmaZamani = DateTime.UtcNow,
                    GecerlilikSuresi = DateTime.UtcNow.AddHours(1), // 1 saat geçerli
                    Kullanildi = false
                };

                _context.SifreSifirlamaTokenlari.Add(tokenEntity);
                await _context.SaveChangesAsync();

                // Sıfırlama linki oluştur
                var resetLink = $"{_frontendUrl}/sifre-sifirla?token={resetToken}";
                _logger.LogInformation("Şifre sıfırlama linki üretildi: {ResetLink}", resetLink);

                // E-posta gönder
                try
                {
                    await _emailService.SendPasswordResetEmailAsync(
                        kullanici.Eposta,
                        resetLink,
                        kullanici.KullaniciAdi ?? kullanici.Eposta.Split('@')[0]
                    );
                    _logger.LogInformation("Şifre sıfırlama e-postası gönderildi: {Eposta}", kullanici.Eposta);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "E-posta gönderimi başarısız: {Eposta}", kullanici.Eposta);
                    return StatusCode(500, new { message = "E-posta gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin." });
                }

                return Ok(new { message = "Şifre sıfırlama linki e-posta adresinize gönderildi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Şifre sıfırlama işlemi sırasında hata oluştu");
                return StatusCode(500, new { message = "Şifre sıfırlama işlemi sırasında bir hata oluştu." });
            }
        }

        // POST: api/auth/reset-password
        // Şifre Sıfırla - Token ile yeni şifre belirle
        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDto model)
        {
            try
            {
                // Şifre kontrolü
                if (model.YeniSifre != model.YeniSifreTekrar)
                {
                    return BadRequest(new { message = "Şifreler eşleşmiyor." });
                }

                if (model.YeniSifre.Length < 6)
                {
                    return BadRequest(new { message = "Şifre en az 6 karakter olmalıdır." });
                }

                // Token'ı bul
                var tokenEntity = await _context.SifreSifirlamaTokenlari
                    .FirstOrDefaultAsync(t => t.Token == model.Token && !t.Kullanildi);

                if (tokenEntity == null)
                {
                    return BadRequest(new { message = "Geçersiz veya kullanılmış sıfırlama linki." });
                }

                // Token süresi kontrolü
                if (tokenEntity.GecerlilikSuresi < DateTime.UtcNow)
                {
                    return BadRequest(new { message = "Sıfırlama linkinin süresi dolmuş. Lütfen yeni bir link talep edin." });
                }

                // Supabase Admin API ile şifreyi güncelle
                var requestBody = new
                {
                    password = model.YeniSifre
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseServiceRoleKey);
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseServiceRoleKey);

                var response = await _httpClient.PutAsync(
                    $"{_supabaseUrl}/auth/v1/admin/users/{tokenEntity.KullaniciId}",
                    content);

                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Supabase şifre güncelleme hatası: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    return BadRequest(new { message = "Şifre güncellenirken bir hata oluştu." });
                }

                // Token'ı kullanıldı olarak işaretle
                tokenEntity.Kullanildi = true;
                tokenEntity.KullanilmaZamani = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Şifre başarıyla sıfırlandı: {KullaniciId}", tokenEntity.KullaniciId);

                return Ok(new { message = "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Şifre güncelleme işlemi sırasında hata oluştu");
                return StatusCode(500, new { message = "Şifre güncelleme işlemi sırasında bir hata oluştu." });
            }
        }

        // POST: api/auth/verify-reset-token
        // Token'ın geçerli olup olmadığını kontrol et
        [HttpPost("verify-reset-token")]
        [AllowAnonymous]
        public async Task<ActionResult> VerifyResetToken([FromBody] VerifyTokenDto model)
        {
            try
            {
                var tokenEntity = await _context.SifreSifirlamaTokenlari
                    .FirstOrDefaultAsync(t => t.Token == model.Token && !t.Kullanildi);

                if (tokenEntity == null)
                {
                    return BadRequest(new { valid = false, message = "Geçersiz veya kullanılmış sıfırlama linki." });
                }

                if (tokenEntity.GecerlilikSuresi < DateTime.UtcNow)
                {
                    return BadRequest(new { valid = false, message = "Sıfırlama linkinin süresi dolmuş." });
                }

                return Ok(new { valid = true, message = "Token geçerli." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Token doğrulama sırasında hata");
                return StatusCode(500, new { valid = false, message = "Bir hata oluştu." });
            }
        }

        // POST: api/auth/refresh
        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenDto model)
        {
            try
            {
                var requestBody = new
                {
                    refresh_token = model.RefreshToken
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseAnonKey);

                var response = await _httpClient.PostAsync(
                    $"{_supabaseUrl}/auth/v1/token?grant_type=refresh_token",
                    content);

                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Token yenileme hatası: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    return Unauthorized(new { message = "Token yenileme başarısız oldu." });
                }

                var authResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                var result = new AuthResponseDto
                {
                    AccessToken = authResponse.GetProperty("access_token").GetString(),
                    RefreshToken = authResponse.GetProperty("refresh_token").GetString(),
                    User = new UserDto
                    {
                        Id = Guid.Parse(authResponse.GetProperty("user").GetProperty("id").GetString()!),
                        Eposta = authResponse.GetProperty("user").GetProperty("email").GetString()!,
                        KullaniciAdi = authResponse.GetProperty("user").GetProperty("user_metadata")
                            .GetProperty("username").GetString() ?? 
                            authResponse.GetProperty("user").GetProperty("email").GetString()!.Split('@')[0]
                    }
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Token yenileme işlemi sırasında hata oluştu");
                return StatusCode(500, new { message = "Token yenileme işlemi sırasında bir hata oluştu." });
            }
        }

        // POST: api/auth/logout
        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult> Logout()
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseAnonKey);
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.PostAsync(
                    $"{_supabaseUrl}/auth/v1/logout",
                    null);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Logout hatası: {StatusCode} - {Content}", response.StatusCode, errorContent);
                }

                return Ok(new { message = "Çıkış başarılı." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Çıkış işlemi sırasında hata oluştu");
                return StatusCode(500, new { message = "Çıkış işlemi sırasında bir hata oluştu." });
            }
        }

        // GET: api/auth/me
        [HttpGet("me")]
        [Authorize]
        public ActionResult<UserDto> GetCurrentUser()
        {
            var userId = User.FindFirst("sub")?.Value;
            var email = User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
            {
                return Unauthorized(new { message = "Kullanıcı bilgisi alınamadı." });
            }

            return Ok(new UserDto
            {
                Id = Guid.Parse(userId),
                Eposta = email,
                KullaniciAdi = User.FindFirst("username")?.Value ?? email.Split('@')[0]
            });
        }

        // Güvenli token oluşturma
        private static string GenerateSecureToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return Convert.ToBase64String(randomBytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
        }
    }

    // DTO for token verification
    public class VerifyTokenDto
    {
        public string Token { get; set; } = null!;
    }
}
