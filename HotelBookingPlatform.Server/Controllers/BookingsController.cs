using AutoMapper;
using HotelBookingPlatform.Core.DTOs;
using HotelBookingPlatform.Core.Entities;
using HotelBookingPlatform.Core.Enums;
using HotelBookingPlatform.Core.Helpers;
using HotelBookingPlatform.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using HotelBookingPlatform.Services.Auth;

namespace HotelBookingPlatform.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BookingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _auditLogService;

    public BookingsController(ApplicationDbContext context, IMapper mapper, IAuditLogService auditLogService)
    {
        _context = context;
        _mapper = mapper;
        _auditLogService = auditLogService;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("User not authenticated or invalid user ID");
        }
        return userId;
    }

    // GET: api/Bookings/my  (returns current authenticated user's bookings)
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<BookingResponseDto>>> GetMyBookings()
    {
        try
        {
            var userId = GetCurrentUserId();
            var bookings = await _context.Bookings!
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Hotel)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
            return Ok(_mapper.Map<IEnumerable<BookingResponseDto>>(bookings));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    // GET: api/Bookings/all  (Admin only — returns all users' bookings)
    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<AdminBookingResponseDto>>> GetAllBookings(
        [FromQuery] string? hotelName,
        [FromQuery] string? guestEmail,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? status)
    {
        var query = _context.Bookings!
            .Include(b => b.User)
            .Include(b => b.Room)
                .ThenInclude(r => r!.Hotel)
            .AsQueryable();

        if (!string.IsNullOrEmpty(hotelName))
            query = query.Where(b => b.Room != null && b.Room.Hotel != null && b.Room.Hotel.Name.Contains(hotelName));

        if (!string.IsNullOrEmpty(guestEmail))
            query = query.Where(b => b.User != null && b.User.Email != null && b.User.Email.Contains(guestEmail));

        if (startDate.HasValue)
            query = query.Where(b => b.CheckInDate >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(b => b.CheckOutDate <= endDate.Value);

        if (!string.IsNullOrEmpty(status))
        {
            if (Enum.TryParse<BookingStatus>(status, true, out var bookingStatus))
                query = query.Where(b => b.Status == bookingStatus);
        }

        var bookings = await query
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return Ok(_mapper.Map<IEnumerable<AdminBookingResponseDto>>(bookings));
    }

    [HttpGet("analytics")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAnalytics()
    {
        var totalRevenue = await _context.Bookings
            .Where(b => b.Status != BookingStatus.Cancelled)
            .SumAsync(b => b.TotalPrice);

        var totalBookings = await _context.Bookings.CountAsync();
        
        var bookingsByStatus = await _context.Bookings
            .GroupBy(b => b.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToListAsync();

        var bookingsByMonth = await _context.Bookings
            .GroupBy(b => new { b.CreatedAt.Year, b.CreatedAt.Month })
            .Select(g => new { 
                Date = $"{g.Key.Year}-{g.Key.Month:D2}", 
                Count = g.Count(),
                Revenue = g.Sum(b => b.TotalPrice)
            })
            .OrderBy(g => g.Date)
            .ToListAsync();

        return Ok(new {
            totalRevenue,
            totalBookings,
            bookingsByStatus,
            bookingsByMonth
        });
    }

    [HttpGet("export-csv")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ExportToCsv()
    {
        var bookings = await _context.Bookings!
            .Include(b => b.User)
            .Include(b => b.Room)
                .ThenInclude(r => r!.Hotel)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        var csv = new System.Text.StringBuilder();
        csv.AppendLine("Reference,Hotel,Guest,Email,CheckIn,CheckOut,Status,Amount");

        foreach (var b in bookings)
        {
            csv.AppendLine($"{b.BookingReference},{b.Room?.Hotel?.Name ?? "N/A"},{b.User?.FirstName ?? "N/A"} {b.User?.LastName ?? "N/A"},{b.User?.Email ?? "N/A"},{b.CheckInDate:yyyy-MM-dd},{b.CheckOutDate:yyyy-MM-dd},{b.Status},{b.TotalPrice}");
        }

        await _auditLogService.LogAsync("ExportToCsv", "Bookings", "Exported booking history to CSV");
        return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"bookings_{DateTime.Now:yyyyMMdd}.csv");
    }

    // GET: api/Bookings/user/5  (own data for users, any userId for admins)
    [HttpGet("user/{userId}")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<BookingResponseDto>>> GetUserBookings(int userId)
    {
        // Regular users can only view their own bookings
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin)
        {
            try
            {
                var requestingUserId = GetCurrentUserId();
                if (requestingUserId != userId)
                    return Forbid(); // 403 — can't peek at other users' data
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }

        var bookings = await _context.Bookings!
            .Include(b => b.Room)
                .ThenInclude(r => r!.Hotel)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return Ok(_mapper.Map<IEnumerable<BookingResponseDto>>(bookings));
    }

    // GET: api/Bookings/5
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<BookingResponseDto>> GetBooking(int id)
    {
        var booking = await _context.Bookings!
            .Include(b => b.Room)
                .ThenInclude(r => r!.Hotel)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
        {
            return NotFound();
        }

        // Only owner or admin can view specific booking details
        var userId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Admin");
        if (booking.UserId != userId && !isAdmin)
        {
            return Forbid();
        }

        return Ok(_mapper.Map<BookingResponseDto>(booking));
    }

    // POST: api/Bookings
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<object>> CreateBooking(CreateBookingDto bookingDto)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Check if room exists
            var room = await _context.Rooms
                .Include(r => r.Hotel)
                .FirstOrDefaultAsync(r => r.Id == bookingDto.RoomId);

            if (room == null)
            {
                return BadRequest("Room not found");
            }

            // Validate dates
            if (bookingDto.CheckInDate >= bookingDto.CheckOutDate)
            {
                return BadRequest("Check-in date must be before check-out date");
            }

            if (bookingDto.CheckInDate < DateTime.Today)
            {
                return BadRequest("Check-in date cannot be in the past");
            }

            // Check if room is available
            var isAvailable = await IsRoomAvailable(
                bookingDto.RoomId,
                bookingDto.CheckInDate,
                bookingDto.CheckOutDate);

            if (!isAvailable)
            {
                return BadRequest("Room is not available for the selected dates");
            }

            // Check room capacity
            if (bookingDto.NumberOfGuests > room.Capacity)
            {
                return BadRequest($"Room can only accommodate {room.Capacity} guests");
            }

            // Calculate total price
            var duration = bookingDto.CheckOutDate - bookingDto.CheckInDate;
            var numberOfNights = duration.Days;
            decimal totalPrice;

            if (numberOfNights > 0)
            {
                totalPrice = room.PricePerNight * numberOfNights;
            }
            else
            {
                // Hourly stay (less than 24 hours)
                var hours = Math.Max(3, Math.Ceiling(duration.TotalHours));
                var hourlyRate = Math.Round(room.PricePerNight / 10, 2);
                totalPrice = hourlyRate * (decimal)hours;
            }

            // Create booking
            var booking = new Booking
            {
                BookingReference = BookingReferenceGenerator.GenerateReference(),
                RoomId = bookingDto.RoomId,
                UserId = userId,
                CheckInDate = bookingDto.CheckInDate,
                CheckOutDate = bookingDto.CheckOutDate,
                NumberOfGuests = bookingDto.NumberOfGuests,
                TotalPrice = totalPrice,
                SpecialRequests = bookingDto.SpecialRequests,
                Status = BookingStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            // Load navigation properties
            await _context.Entry(booking)
                .Reference(b => b.Room)
                .Query()
                .Include(r => r.Hotel)
                .LoadAsync();

            var response = _mapper.Map<BookingResponseDto>(booking);

            // Return with payment information
            return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, new
            {
                booking = response,
                requiresPayment = true,
                paymentEndpoint = $"/api/Payments/create-payment-intent/{booking.Id}"
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    // PUT: api/Bookings/5/cancel  (cancel by integer id)
    [HttpPut("{id:int}/cancel")]
    [Authorize]
    public async Task<IActionResult> CancelBooking(int id)
    {
        var booking = await _context.Bookings.FindAsync(id);

        if (booking == null)
        {
            return NotFound();
        }

        // Only owner or admin can cancel
        var userId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Admin");
        if (booking.UserId != userId && !isAdmin)
        {
            return Forbid();
        }

        // Can only cancel pending or confirmed bookings
        if (booking.Status == BookingStatus.Cancelled ||
            booking.Status == BookingStatus.Completed)
        {
            return BadRequest($"Cannot cancel booking with status {booking.Status}");
        }

        // Check if check-in date is too close
        if (booking.CheckInDate <= DateTime.Today.AddDays(1))
        {
            return BadRequest("Cannot cancel booking within 24 hours of check-in");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PUT: api/Bookings/ABC-123/cancel (cancel by reference string)
    [HttpPut("{reference}/cancel")]
    [Authorize]
    public async Task<IActionResult> CancelBookingByReference(string reference)
    {
        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.BookingReference == reference);

        if (booking == null)
        {
            return NotFound();
        }

        // Only owner or admin can cancel
        var userId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Admin");
        if (booking.UserId != userId && !isAdmin)
        {
            return Forbid();
        }

        if (booking.Status == BookingStatus.Cancelled ||
            booking.Status == BookingStatus.Completed)
        {
            return BadRequest($"Cannot cancel booking with status {booking.Status}");
        }

        if (booking.CheckInDate <= DateTime.Today.AddDays(1))
        {
            return BadRequest("Cannot cancel booking within 24 hours of check-in");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/Bookings/check-availability
    [HttpGet("check-availability")]
    public async Task<ActionResult<bool>> CheckAvailability(
        [FromQuery] int roomId,
        [FromQuery] DateTime checkIn,
        [FromQuery] DateTime checkOut)
    {
        var isAvailable = await IsRoomAvailable(roomId, checkIn, checkOut);
        return Ok(isAvailable);
    }

    private async Task<bool> IsRoomAvailable(int roomId, DateTime checkIn, DateTime checkOut)
    {
        var conflictingBookings = await _context.Bookings
            .Where(b => b.RoomId == roomId &&
                   b.Status != BookingStatus.Cancelled &&
                   b.CheckInDate < checkOut &&
                   b.CheckOutDate > checkIn)
            .AnyAsync();

        return !conflictingBookings;
    }
}