using System.ComponentModel.DataAnnotations;

namespace HotelBookingPlatform.Core.DTOs;

public class HotelDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public int StarRating { get; set; }
    public string? MainImageUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? OwnerId { get; set; }
    public decimal PricePerNight { get; set; } // Average price
    public List<RoomDto> Rooms { get; set; } = new();
}

public class CreateHotelDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Address { get; set; } = string.Empty;

    [Required]
    public string City { get; set; } = string.Empty;

    [Required]
    public string Country { get; set; } = string.Empty;

    public string? PostalCode { get; set; }

    [Range(1, 5)]
    public int StarRating { get; set; } = 3;

    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? CheckInTime { get; set; } = "15:00";
    public string? CheckOutTime { get; set; } = "11:00";
    public string? MainImageUrl { get; set; }
}

public class CreateFullHotelDto : CreateHotelDto
{
    public List<CreateRoomDto> Rooms { get; set; } = new();
    public List<int> AmenityIds { get; set; } = new();
}

public class CreateRoomDto
{
    [Required]
    public string RoomNumber { get; set; } = string.Empty;
    [Required]
    public string RoomType { get; set; } = string.Empty;
    [Required]
    public decimal PricePerNight { get; set; }
    [Required]
    public int Capacity { get; set; }
    public bool IsAvailable { get; set; } = true;
    public List<int> AmenityIds { get; set; } = new();
}

public class UpdateHotelDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Address { get; set; } = string.Empty;

    [Required]
    public string City { get; set; } = string.Empty;

    [Required]
    public string Country { get; set; } = string.Empty;

    public string? PostalCode { get; set; }

    [Range(1, 5)]
    public int StarRating { get; set; }

    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? CheckInTime { get; set; }
    public string? CheckOutTime { get; set; }
    public string? MainImageUrl { get; set; }
}