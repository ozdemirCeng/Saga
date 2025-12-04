using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Saga.Server.Data;
using Saga.Server.Models;
using Saga.Server.Services;
using Saga.Server.Middleware;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. VERİTABANI BAĞLANTISI (SADE VE TEMİZ)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// DataSourceBuilder ile Enum mapleme yapıyoruz
var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.MapEnum<ApiKaynak>("api_kaynak");
dataSourceBuilder.MapEnum<IcerikTuru>("icerik_turu");
dataSourceBuilder.MapEnum<KullaniciRol>("kullanici_rol");
dataSourceBuilder.MapEnum<AktiviteTuru>("aktivite_turu");
dataSourceBuilder.MapEnum<ListeTuru>("liste_turu");
dataSourceBuilder.MapEnum<KutuphaneDurum>("kutuphane_durum");
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<SagaDbContext>(options =>
    options.UseNpgsql(dataSource));

// 2. TOKEN SERVİSİ
builder.Services.AddScoped<TokenService>();

// 2.1. EMAIL SERVİSİ
builder.Services.AddScoped<IEmailService, EmailService>();
Console.WriteLine("[Startup] IEmailService registered");

// 2.2. EXTERNAL API SERVİSLERİ
builder.Services.AddHttpClient<ITmdbService, TmdbService>();
builder.Services.AddHttpClient<IGoogleBooksService, GoogleBooksService>();

// 3. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactAppPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("X-Toplam-Sayfa", "X-Toplam-Kayit", "X-Mevcut-Sayfa");
    });
});

// 4. AUTH - SUPABASE JWT VALIDATION
var supabaseUrl = builder.Configuration["Supabase:Url"] ?? throw new Exception("Supabase URL bulunamadı!");
var supabaseJwtSecret = builder.Configuration["Supabase:JwtSecret"] ?? throw new Exception("Supabase JWT Secret bulunamadı!");
var supabaseProjectRef = new Uri(supabaseUrl).Host.Split('.')[0]; // iabkzwsosqpcghjqkbzt

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(supabaseJwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5),
            NameClaimType = "sub" // Supabase'de user ID "sub" claim'inde
        };
        
        // Debug için JWT hatalarını loglayalım
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"🔴 JWT Authentication failed: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine($"✅ JWT Token validated successfully for user: {context.Principal?.FindFirst("sub")?.Value}");
                return Task.CompletedTask;
            },
            OnMessageReceived = context =>
            {
                var token = context.Request.Headers["Authorization"].ToString();
                if (!string.IsNullOrEmpty(token))
                {
                    Console.WriteLine($"📩 Received token: {token.Substring(0, Math.Min(50, token.Length))}...");
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// DB TEST
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SagaDbContext>();
    try
    {
        if (db.Database.CanConnect())
            Console.WriteLine("✅✅✅ BAŞARILI: Saga Veritabanına Bağlanıldı! ✅✅✅");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌❌❌ DB Hatası: {ex.Message}");
    }
}

app.UseDefaultFiles();
app.UseStaticFiles();

// Global exception handling
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("ReactAppPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SPA fallback disabled for API-only testing
// app.MapFallbackToFile("/index.html");

app.Run();