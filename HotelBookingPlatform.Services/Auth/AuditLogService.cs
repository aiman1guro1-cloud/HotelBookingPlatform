using HotelBookingPlatform.Core.Entities;
using HotelBookingPlatform.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace HotelBookingPlatform.Services.Auth;

public interface IAuditLogService
{
    Task LogAsync(string action, string controller, string details);
}

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditLogService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(string action, string controller, string details)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var userId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userEmail = user?.FindFirst(ClaimTypes.Email)?.Value;
        var ipAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "Unknown";

        var log = new AuditLog
        {
            Action = action,
            Controller = controller,
            Details = details,
            UserId = userId != null ? int.Parse(userId) : null,
            UserEmail = userEmail,
            IpAddress = ipAddress,
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
