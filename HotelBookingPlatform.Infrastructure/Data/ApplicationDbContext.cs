using Microsoft.EntityFrameworkCore;
using HotelBookingPlatform.Core.Entities;

namespace HotelBookingPlatform.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSets for all entities
    public DbSet<User> Users { get; set; }
    public DbSet<Hotel> Hotels { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<Amenity> Amenities { get; set; }
    public DbSet<HotelImage> HotelImages { get; set; }
    public DbSet<RoomImage> RoomImages { get; set; }
    public DbSet<RoomAmenity> RoomAmenities { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<UserPaymentMethod> UserPaymentMethods { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure relationships and constraints

        // User - Booking (one-to-many)
        modelBuilder.Entity<Booking>()
            .HasOne(b => b.User)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // User - Review (one-to-many)
        modelBuilder.Entity<Review>()
            .HasOne(r => r.User)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Hotel - Owner (one-to-many)
        modelBuilder.Entity<Hotel>()
            .HasOne(h => h.Owner)
            .WithMany()
            .HasForeignKey(h => h.OwnerId)
            .OnDelete(DeleteBehavior.SetNull);

        // Hotel - Room (one-to-many)
        modelBuilder.Entity<Room>()
            .HasOne(r => r.Hotel)
            .WithMany(h => h.Rooms)
            .HasForeignKey(r => r.HotelId)
            .OnDelete(DeleteBehavior.Cascade);

        // Hotel - Review (one-to-many)
        modelBuilder.Entity<Review>()
            .HasOne(r => r.Hotel)
            .WithMany(h => h.Reviews)
            .HasForeignKey(r => r.HotelId)
            .OnDelete(DeleteBehavior.Cascade);

        // Hotel - HotelImage (one-to-many)
        modelBuilder.Entity<HotelImage>()
            .HasOne(hi => hi.Hotel)
            .WithMany(h => h.Images)
            .HasForeignKey(hi => hi.HotelId)
            .OnDelete(DeleteBehavior.Cascade);

        // Room - Booking (one-to-many)
        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Room)
            .WithMany(r => r.Bookings)
            .HasForeignKey(b => b.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        // Room - RoomImage (one-to-many)
        modelBuilder.Entity<RoomImage>()
            .HasOne(ri => ri.Room)
            .WithMany(r => r.Images)
            .HasForeignKey(ri => ri.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        // Room - RoomAmenity (one-to-many)
        modelBuilder.Entity<RoomAmenity>()
            .HasOne(ra => ra.Room)
            .WithMany(r => r.RoomAmenities)
            .HasForeignKey(ra => ra.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RoomAmenity>()
            .HasOne(ra => ra.Amenity)
            .WithMany()
            .HasForeignKey(ra => ra.AmenityId)
            .OnDelete(DeleteBehavior.Cascade);

        // Booking - Payment (one-to-one)
        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Booking)
            .WithOne(b => b.Payment)
            .HasForeignKey<Payment>(p => p.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        // User - PaymentMethod (one-to-many)
        modelBuilder.Entity<UserPaymentMethod>()
            .HasOne(upm => upm.User)
            .WithMany(u => u.PaymentMethods)
            .HasForeignKey(upm => upm.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Add unique constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Hotel>()
            .HasIndex(h => new { h.Name, h.City })
            .IsUnique();

        modelBuilder.Entity<Room>()
            .HasIndex(r => new { r.HotelId, r.RoomNumber })
            .IsUnique();

        modelBuilder.Entity<Booking>()
            .HasIndex(b => b.BookingReference)
            .IsUnique();

        // Configure decimal precision for all money/price fields
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.Property(b => b.TotalPrice).HasPrecision(18, 2);
            entity.Property(b => b.DiscountAmount).HasPrecision(18, 2);
            entity.Property(b => b.TaxAmount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.Property(p => p.Amount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.Property(r => r.PricePerNight).HasPrecision(18, 2);
        });
    }
}
