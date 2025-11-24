using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Saga.Server.Data;
using Saga.Server.Models;
using Saga.Server.Services;

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

// 2.1. EXTERNAL API SERVİSLERİ
builder.Services.AddHttpClient<ITmdbService, TmdbService>();
builder.Services.AddHttpClient<IGoogleBooksService, GoogleBooksService>();

// 3. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactAppPolicy", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

// 4. AUTH - SUPABASE JWT VALIDATION
var supabaseUrl = builder.Configuration["Supabase:Url"] ?? throw new Exception("Supabase URL bulunamadı!");
var supabaseProjectRef = new Uri(supabaseUrl).Host.Split('.')[0]; // iabkzwsosqpcghjqkbzt

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"{supabaseUrl}/auth/v1";
        options.Audience = "authenticated";
        options.RequireHttpsMetadata = true;
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5)
        };

        // JWKS endpoint (modern ECC P-256 keys)
        options.MetadataAddress = $"{supabaseUrl}/auth/v1/.well-known/jwks.json";
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

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("ReactAppPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("/index.html");

app.Run();