using HotelBookingPlatform.Core.Entities.Base;
using HotelBookingPlatform.Core.Enums;

namespace HotelBookingPlatform.Core.Entities;

public class Hotel : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? PostalCode { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public int StarRating { get; set; }  // 1-5 stars
    public string? MainImageUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? CheckInTime { get; set; }  // e.g., "14:00"
    public string? CheckOutTime { get; set; }  // e.g., "11:00"
    public HotelStatus Status { get; set; } = HotelStatus.Pending;
    public int? OwnerId { get; set; }
    public User? Owner { get; set; }

    // Navigation properties - THESE WERE MISSING
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<Amenity> Amenities { get; set; } = new List<Amenity>();
    public ICollection<HotelImage> Images { get; set; } = new List<HotelImage>();
}