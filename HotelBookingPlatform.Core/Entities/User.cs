using HotelBookingPlatform.Core.Entities.Base;
using HotelBookingPlatform.Core.Enums;

namespace HotelBookingPlatform.Core.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public UserRole Role { get; set; } = UserRole.Guest;
    public bool IsEmailVerified { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetExpiry { get; set; }

    // Navigation properties - THESE WERE MISSING
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<UserPaymentMethod> PaymentMethods { get; set; } = new List<UserPaymentMethod>();
}