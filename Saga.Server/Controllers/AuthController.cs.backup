using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Saga.Server.Data;
using Saga.Server.DTOs;
using Saga.Server.Models;

namespace Saga.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly SagaDbContext _context;

        public AuthController(SagaDbContext context)
        {
            _context = context;
        }

        // POST: api/auth/register
        // Not: Gerçek kaydı Supabase Client (Frontend) yapacak. 
        // Biz burada o kullanıcıyı kendi veritabanımıza "Sync" (Senkronize) edeceğiz.
        [HttpPost("sync-user")]
        public async Task<IActionResult> SyncUser([FromBody] RegisterDto model)
        {
            // Kullanıcı zaten var mı?
            var exists = await _context.Kullanicilar.AnyAsync(u => u.Eposta == model.Eposta);
            if (exists) return Ok(new { message = "Kullanıcı zaten mevcut" });

            var newUser = new Kullanici
            {
                Id = Guid.NewGuid(), // Supabase ID'sini buraya alacağız ileride
                KullaniciAdi = model.KullaniciAdi,
                Eposta = model.Eposta,
                OlusturulmaZamani = DateTime.UtcNow,
                AvatarUrl = $"https://ui-avatars.com/api/?name={model.KullaniciAdi}&background=random"
            };

            _context.Kullanicilar.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Kullanıcı başarıyla eşitlendi" });
        }
    }
}