using HotelBookingPlatform.Core.Entities.Base;

namespace HotelBookingPlatform.Core.Entities;

public class RoomAmenity : BaseEntity
{
    // Foreign keys
    public int RoomId { get; set; }
    public Room Room { get; set; } = null!;

    public int AmenityId { get; set; }
    public Amenity Amenity { get; set; } = null!;
}