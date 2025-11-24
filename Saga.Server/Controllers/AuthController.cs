using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saga.Server.DTOs;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;

namespace Saga.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _supabaseUrl;
        private readonly string _supabaseAnonKey;

        public AuthController(
            IConfiguration configuration,
            ILogger<AuthController> logger,
            IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            _supabaseUrl = configuration["Supabase:Url"] ?? throw new Exception("Supabase URL bulunamadı!");
            _supabaseAnonKey = configuration["Supabase:AnonKey"] ?? throw new Exception("Supabase Anon Key bulunamadı!");
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
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordDto model)
        {
            try
            {
                var requestBody = new
                {
                    email = model.Eposta
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseAnonKey);

                var response = await _httpClient.PostAsync(
                    $"{_supabaseUrl}/auth/v1/recover",
                    content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Şifre sıfırlama hatası: {StatusCode} - {Content}", response.StatusCode, errorContent);
                }

                // Güvenlik nedeniyle her zaman başarılı mesaj dön
                return Ok(new { message = "Eğer e-posta kayıtlıysa, şifre sıfırlama linki gönderildi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Şifre sıfırlama işlemi sırasında hata oluştu");
                return StatusCode(500, new { message = "Şifre sıfırlama işlemi sırasında bir hata oluştu." });
            }
        }

        // POST: api/auth/reset-password
        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDto model)
        {
            try
            {
                var requestBody = new
                {
                    password = model.YeniSifre
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseAnonKey);
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", model.Token);

                var response = await _httpClient.PutAsync(
                    $"{_supabaseUrl}/auth/v1/user",
                    content);

                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Şifre güncelleme hatası: {StatusCode} - {Content}", response.StatusCode, responseContent);
                    return BadRequest(new { message = "Şifre sıfırlama başarısız oldu. Token geçersiz veya süresi dolmuş olabilir." });
                }

                return Ok(new { message = "Şifreniz başarıyla güncellendi." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Şifre güncelleme işlemi sırasında hata oluştu");
                return StatusCode(500, new { message = "Şifre güncelleme işlemi sırasında bir hata oluştu." });
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
    }
}