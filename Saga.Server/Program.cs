using Microsoft.EntityFrameworkCore;
using ReelPage.Server.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Veritabanı Servisini Ekle
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ReelPageDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Controller'ları Ekle
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 3. Veritabanı Bağlantı Testi (Uygulama açılırken kontrol eder)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ReelPageDbContext>();
    try
    {
        if (db.Database.CanConnect())
        {
            Console.WriteLine("✅✅✅ BAŞARILI: Veritabanına Bağlanıldı! ✅✅✅");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌❌❌ HATA: Veritabanına bağlanılamadı. Hata: {ex.Message}");
    }
}

app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("/index.html");

app.Run();