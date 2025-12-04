using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Saga.Server.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string toEmail, string resetLink, string userName);
        Task SendEmailAsync(string toEmail, string subject, string htmlBody);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpUser;
        private readonly string _smtpPassword;
        private readonly string _fromEmail;
        private readonly string _fromName;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            
            // SMTP ayarları - appsettings.json veya environment variables
            _smtpHost = configuration["Smtp:Host"] ?? "smtp.gmail.com";
            _smtpPort = int.Parse(configuration["Smtp:Port"] ?? "587");
            _smtpUser = configuration["Smtp:User"] ?? "";
            _smtpPassword = configuration["Smtp:Password"] ?? "";
            _fromEmail = configuration["Smtp:FromEmail"] ?? _smtpUser;
            _fromName = configuration["Smtp:FromName"] ?? "SAGA";
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink, string userName)
        {
            var subject = "SAGA - Şifre Sıfırlama";
            
            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; }}
        .content {{ padding: 40px 30px; color: #333; }}
        .content h2 {{ color: #333; margin-top: 0; }}
        .content p {{ line-height: 1.6; color: #555; }}
        .button {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
        .button:hover {{ opacity: 0.9; }}
        .warning {{ background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px; }}
        .footer {{ background-color: #f8f9fa; padding: 20px 30px; text-align: center; color: #888; font-size: 12px; }}
        .link-text {{ word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎬 SAGA</h1>
            <p style='margin: 10px 0 0 0; opacity: 0.9;'>Film & Kitap Takip Platformu</p>
        </div>
        <div class='content'>
            <h2>Merhaba {userName},</h2>
            <p>SAGA hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
            
            <div style='text-align: center;'>
                <a href='{resetLink}' class='button'>Şifremi Sıfırla</a>
            </div>
            
            <p>Eğer buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayın:</p>
            <p class='link-text'>{resetLink}</p>
            
            <div class='warning'>
                <strong>⚠️ Önemli:</strong>
                <ul style='margin: 10px 0 0 0; padding-left: 20px;'>
                    <li>Bu link <strong>1 saat</strong> içinde geçerliliğini yitirecektir.</li>
                    <li>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelin.</li>
                    <li>Güvenliğiniz için bu linki kimseyle paylaşmayın.</li>
                </ul>
            </div>
        </div>
        <div class='footer'>
            <p>Bu e-posta SAGA tarafından otomatik olarak gönderilmiştir.</p>
            <p>© 2025 SAGA - Tüm hakları saklıdır.</p>
        </div>
    </div>
</body>
</html>";

            await SendEmailAsync(toEmail, subject, htmlBody);
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_fromName, _fromEmail));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = htmlBody
                };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                
                // Gmail için STARTTLS kullan
                await client.ConnectAsync(_smtpHost, _smtpPort, SecureSocketOptions.StartTls);
                
                // Kimlik doğrulama
                await client.AuthenticateAsync(_smtpUser, _smtpPassword);
                
                // E-postayı gönder
                await client.SendAsync(message);
                
                await client.DisconnectAsync(true);
                
                _logger.LogInformation("E-posta başarıyla gönderildi: {ToEmail}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "E-posta gönderilirken hata oluştu: {ToEmail}", toEmail);
                throw;
            }
        }
    }
}
