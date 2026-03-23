using HotelBookingPlatform.Core.Entities.Base;

namespace HotelBookingPlatform.Core.Entities;

public class AuditLog : BaseEntity
{
    public string Action { get; set; } = string.Empty;
    public string Controller { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public int? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string IpAddress { get; set; } = string.Empty;
}
