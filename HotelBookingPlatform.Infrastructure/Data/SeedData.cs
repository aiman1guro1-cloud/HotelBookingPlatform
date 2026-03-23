using HotelBookingPlatform.Core.Entities;
using HotelBookingPlatform.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HotelBookingPlatform.Infrastructure.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var context = new ApplicationDbContext(
            serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>());

        // Seed default admin account if none exists
        if (!context.Users.Any(u => u.Role == UserRole.Admin))
        {
            // Simple BCrypt-compatible hash for "Admin@123"
            var adminUser = new User
            {
                Email = "admin@hotelbooking.com",
                FirstName = "Admin",
                LastName = "System",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow,
                IsEmailVerified = true
            };
            context.Users.Add(adminUser);
            await context.SaveChangesAsync();
        }

        // Check if there's already hotel data
        if (context.Hotels.Any())
        {
            return; // Database already seeded
        }

        // Add amenities first
        var wifi = new Amenity { Name = "Free WiFi", Description = "High-speed internet", IconUrl = "wifi-icon" };
        var pool = new Amenity { Name = "Swimming Pool", Description = "Outdoor pool", IconUrl = "pool-icon" };
        var parking = new Amenity { Name = "Free Parking", Description = "On-site parking", IconUrl = "parking-icon" };
        var breakfast = new Amenity { Name = "Breakfast Included", Description = "Complimentary breakfast", IconUrl = "breakfast-icon" };
        var gym = new Amenity { Name = "Fitness Center", Description = "24/7 gym access", IconUrl = "gym-icon" };
        var spa = new Amenity { Name = "Spa", Description = "Full-service spa", IconUrl = "spa-icon" };
        var ac = new Amenity { Name = "Air Conditioning", Description = "Climate control", IconUrl = "ac-icon" };
        var tv = new Amenity { Name = "Flat-screen TV", Description = "Entertainment", IconUrl = "tv-icon" };
        var minibar = new Amenity { Name = "Mini Bar", Description = "Drinks and snacks", IconUrl = "minibar-icon" };
        var coffee = new Amenity { Name = "Coffee Maker", Description = "In-room coffee", IconUrl = "coffee-icon" };
        var heating = new Amenity { Name = "Heating", Description = "Room heating", IconUrl = "heating-icon" };
        var jacuzzi = new Amenity { Name = "Jacuzzi", Description = "Private hot tub", IconUrl = "jacuzzi-icon" };

        context.Amenities.AddRange(wifi, pool, parking, breakfast, gym, spa, ac, tv, minibar, coffee, heating, jacuzzi);
        await context.SaveChangesAsync();
        
        // Removed all default hotels and rooms as requested by the user.
        // The system will now start with a clean state (only Amenities and Admin account).
    }
}