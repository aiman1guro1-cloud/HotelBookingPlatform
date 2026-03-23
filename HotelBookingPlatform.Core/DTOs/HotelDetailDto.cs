using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HotelBookingPlatform.Core.DTOs;

public class HotelDetailDto : HotelDto
{
    public string Address { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? CheckInTime { get; set; }
    public string? CheckOutTime { get; set; }
    public new List<RoomDto> Rooms { get; set; } = new();
    public List<string> Amenities { get; set; } = new();
    public List<ReviewDto> Reviews { get; set; } = new();
}