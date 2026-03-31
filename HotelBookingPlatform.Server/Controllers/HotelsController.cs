using HotelBookingPlatform.Infrastructure.Data;
using HotelBookingPlatform.Core.Entities;
using HotelBookingPlatform.Core.DTOs;
using HotelBookingPlatform.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using HotelBookingPlatform.Services.Auth;
using HotelBookingPlatform.Services.Common;

namespace HotelBookingPlatform.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class HotelsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _auditLogService;
    private readonly IImageService _imageService;

    public HotelsController(ApplicationDbContext context, IMapper mapper, IAuditLogService auditLogService, IImageService imageService)
    {
        _context = context;
        _mapper = mapper;
        _auditLogService = auditLogService;
        _imageService = imageService;
    }

    [HttpPost("upload-image")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        try
        {
            var imageUrl = await _imageService.UploadImageAsync(file, "hotels");
            return Ok(new { imageUrl });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during upload.", error = ex.Message });
        }
    }

    // GET: api/Hotels
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HotelDto>>> GetHotels([FromQuery] string? status)
    {
        var query = _context.Hotels.AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            if (Enum.TryParse<HotelStatus>(status, true, out var hotelStatus))
            {
                query = query.Where(h => h.Status == hotelStatus);
            }
        }
        else
        {
            // By default, only show approved hotels to guests
            query = query.Where(h => h.Status == HotelStatus.Approved);
        }

        var hotels = await query
            .Include(h => h.Rooms)
            .ToListAsync();

        return Ok(_mapper.Map<IEnumerable<HotelDto>>(hotels));
    }

    // POST: api/Hotels/register
    [HttpPost("register")]
    [Authorize]
    public async Task<ActionResult<HotelDto>> RegisterHotel([FromBody] CreateHotelDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        int? ownerId = userIdClaim != null ? int.Parse(userIdClaim.Value) : null;

        var hotel = new Hotel
        {
            Name = dto.Name,
            Description = dto.Description,
            Address = dto.Address,
            City = dto.City,
            Country = dto.Country,
            PostalCode = dto.PostalCode,
            StarRating = dto.StarRating,
            PhoneNumber = dto.PhoneNumber,
            Email = dto.Email,
            Website = dto.Website,
            CheckInTime = dto.CheckInTime ?? "15:00",
            CheckOutTime = dto.CheckOutTime ?? "11:00",
            MainImageUrl = dto.MainImageUrl,
            Status = HotelStatus.Pending,
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Hotels.Add(hotel);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetHotel), new { id = hotel.Id }, _mapper.Map<HotelDto>(hotel));
    }

    // PUT: api/Hotels/5/approve
    [HttpPut("{id}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveHotel(int id)
    {
        var hotel = await _context.Hotels.FindAsync(id);
        if (hotel == null)
            return NotFound();

        hotel.Status = HotelStatus.Approved;
        hotel.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("ApproveHotel", "Hotels", $"Approved hotel ID: {id}");
        return Ok(new { message = "Hotel approved successfully.", status = "Approved" });
    }

    // PUT: api/Hotels/5/reject
    [HttpPut("{id}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RejectHotel(int id)
    {
        var hotel = await _context.Hotels.FindAsync(id);
        if (hotel == null)
            return NotFound();

        hotel.Status = HotelStatus.Rejected;
        hotel.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Hotel rejected.", status = "Rejected" });
    }

    // PUT: api/Hotels/5/status
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateHotelStatus(int id, [FromQuery] HotelStatus status)
    {
        var hotel = await _context.Hotels.FindAsync(id);
        if (hotel == null)
            return NotFound();

        hotel.Status = status;
        hotel.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Hotel status updated to {status}.", status = status.ToString() });
    }

    // GET: api/Hotels/5
    [HttpGet("{id}")]
    public async Task<ActionResult<HotelDetailDto>> GetHotel(int id)
    {
        try 
        {
            var hotel = await _context.Hotels
                .Include(h => h.Rooms)
                    .ThenInclude(r => r.RoomAmenities)
                        .ThenInclude(ra => ra.Amenity)
                .Include(h => h.Amenities)
                .Include(h => h.Reviews)
                    .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(h => h.Id == id);

            if (hotel == null)
            {
                return NotFound(new { message = $"Hotel with ID {id} not found." });
            }

            return Ok(_mapper.Map<HotelDetailDto>(hotel));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving hotel details.", error = ex.Message });
        }
    }

    // GET: api/Hotels/5/rooms
    [HttpGet("{hotelId}/rooms")]
    public async Task<ActionResult<IEnumerable<RoomDetailDto>>> GetRoomsByHotel(int hotelId)
    {
        var rooms = await _context.Rooms
            .Include(r => r.RoomAmenities)
                .ThenInclude(ra => ra.Amenity)
            .Where(r => r.HotelId == hotelId)
            .ToListAsync();

        return Ok(_mapper.Map<IEnumerable<RoomDetailDto>>(rooms));
    }

    [HttpDelete("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAllHotels()
    {
        // Deletion in order to respect foreign keys
        _context.Payments.RemoveRange(_context.Payments);
        _context.Bookings.RemoveRange(_context.Bookings);
        _context.Reviews.RemoveRange(_context.Reviews);
        _context.RoomAmenities.RemoveRange(_context.RoomAmenities);
        _context.RoomImages.RemoveRange(_context.RoomImages);
        _context.Rooms.RemoveRange(_context.Rooms);
        _context.HotelImages.RemoveRange(_context.HotelImages);
        _context.Hotels.RemoveRange(_context.Hotels);

        await _context.SaveChangesAsync();
        await _auditLogService.LogAsync("DeleteAllHotels", "Hotels", "Deleted all hotels and related data.");

        return Ok(new { message = "All hotels and associated data have been removed." });
    }

    // POST: api/Hotels  (Admin only)
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<HotelDto>> CreateHotel([FromBody] CreateFullHotelDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var hotel = new Hotel
            {
                Name = dto.Name,
                Description = dto.Description,
                Address = dto.Address,
                City = dto.City,
                Country = dto.Country,
                PostalCode = dto.PostalCode,
                StarRating = dto.StarRating,
                PhoneNumber = dto.PhoneNumber,
                Email = dto.Email,
                Website = dto.Website,
                CheckInTime = dto.CheckInTime ?? "15:00",
                CheckOutTime = dto.CheckOutTime ?? "11:00",
                MainImageUrl = dto.MainImageUrl,
                Status = HotelStatus.Approved,
                CreatedAt = DateTime.UtcNow
            };

            // Add Hotel Amenities
            if (dto.AmenityIds.Any())
            {
                hotel.Amenities = await _context.Amenities
                    .Where(a => dto.AmenityIds.Contains(a.Id))
                    .ToListAsync();
            }

            _context.Hotels.Add(hotel);
            await _context.SaveChangesAsync();

            // Add Rooms
            foreach (var rDto in dto.Rooms)
            {
                var room = new Room
                {
                    HotelId = hotel.Id,
                    RoomNumber = rDto.RoomNumber,
                    RoomType = rDto.RoomType,
                    PricePerNight = rDto.PricePerNight,
                    Capacity = rDto.Capacity,
                    Status = rDto.IsAvailable ? RoomStatus.Available : RoomStatus.Maintenance,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Rooms.Add(room);
                await _context.SaveChangesAsync();

                // Add Room Amenities
                if (rDto.AmenityIds != null && rDto.AmenityIds.Any())
                {
                    _context.RoomAmenities.AddRange(rDto.AmenityIds.Select(amId => new RoomAmenity { RoomId = room.Id, AmenityId = amId }));
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            await _auditLogService.LogAsync("CreateHotel", "Hotels", $"Created new hotel '{hotel.Name}' with {dto.Rooms.Count} rooms.");
            return CreatedAtAction(nameof(GetHotel), new { id = hotel.Id }, _mapper.Map<HotelDto>(hotel));
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { message = "Error creating hotel with rooms.", error = ex.Message });
        }
    }

    // PUT: api/Hotels/5  (Admin only)
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<HotelDto>> UpdateHotel(int id, UpdateHotelDto dto)
    {
        var hotel = await _context.Hotels
            .Include(h => h.Amenities)
            .FirstOrDefaultAsync(h => h.Id == id);

        if (hotel == null)
            return NotFound();

        hotel.Name = dto.Name;
        hotel.Description = dto.Description;
        hotel.Address = dto.Address;
        hotel.City = dto.City;
        hotel.Country = dto.Country;
        hotel.PostalCode = dto.PostalCode;
        hotel.StarRating = dto.StarRating;
        hotel.PhoneNumber = dto.PhoneNumber;
        hotel.Email = dto.Email;
        hotel.Website = dto.Website;
        hotel.CheckInTime = dto.CheckInTime ?? hotel.CheckInTime;
        hotel.CheckOutTime = dto.CheckOutTime ?? hotel.CheckOutTime;
        hotel.MainImageUrl = dto.MainImageUrl;
        hotel.UpdatedAt = DateTime.UtcNow;

        // Update amenities
        hotel.Amenities.Clear();
        if (dto.AmenityIds != null && dto.AmenityIds.Any())
        {
            var amenities = await _context.Amenities
                .Where(a => dto.AmenityIds.Contains(a.Id))
                .ToListAsync();
            foreach (var amenity in amenities)
            {
                hotel.Amenities.Add(amenity);
            }
        }

        await _context.SaveChangesAsync();

        return Ok(_mapper.Map<HotelDto>(hotel));
    }

    // DELETE: api/Hotels/5  (Admin only)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteHotel(int id)
    {
        var hotel = await _context.Hotels
            .Include(h => h.Rooms)
                .ThenInclude(r => r.Bookings)
                    .ThenInclude(b => b.Payment)
            .Include(h => h.Rooms)
                .ThenInclude(r => r.RoomAmenities)
            .Include(h => h.Rooms)
                .ThenInclude(r => r.Images)
            .Include(h => h.Reviews)
            .Include(h => h.Images)
            .Include(h => h.Amenities)
            .FirstOrDefaultAsync(h => h.Id == id);

        if (hotel == null)
            return NotFound();

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Remove related data manually for safety and to handle Restricted deletes if any
            foreach (var room in hotel.Rooms)
            {
                foreach (var booking in room.Bookings)
                {
                    if (booking.Payment != null)
                        _context.Payments.Remove(booking.Payment);
                    
                    _context.Bookings.Remove(booking);
                }
                _context.RoomAmenities.RemoveRange(room.RoomAmenities);
                _context.RoomImages.RemoveRange(room.Images);
            }

            _context.Reviews.RemoveRange(hotel.Reviews);
            _context.HotelImages.RemoveRange(hotel.Images);
            
            // Clear many-to-many relationship with amenities
            hotel.Amenities.Clear();

            _context.Rooms.RemoveRange(hotel.Rooms);
            _context.Hotels.Remove(hotel);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            await _auditLogService.LogAsync("DeleteHotel", "Hotels", $"Deleted hotel ID: {id} and all related data.");
            return NoContent();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { message = "Error deleting hotel and related data.", error = ex.Message });
        }
    }

    [HttpDelete("bulk-remove-non-admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BulkRemoveNonAdminHotels()
    {
        // Identify hotels where OwnerId is null (seeded hotels)
        var nonAdminHotels = await _context.Hotels
            .Include(h => h.Rooms)
                .ThenInclude(r => r.Bookings)
                    .ThenInclude(b => b.Payment)
            .Include(h => h.Rooms)
                .ThenInclude(r => r.RoomAmenities)
            .Include(h => h.Rooms)
                .ThenInclude(r => r.Images)
            .Include(h => h.Reviews)
            .Include(h => h.Images)
            .Include(h => h.Amenities)
            .Where(h => h.OwnerId == null)
            .ToListAsync();

        if (!nonAdminHotels.Any())
            return Ok(new { message = "No non-admin hotels found." });

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            int count = nonAdminHotels.Count;
            foreach (var hotel in nonAdminHotels)
            {
                foreach (var room in hotel.Rooms)
                {
                    foreach (var booking in room.Bookings)
                    {
                        if (booking.Payment != null)
                            _context.Payments.Remove(booking.Payment);
                        
                        _context.Bookings.Remove(booking);
                    }
                    _context.RoomAmenities.RemoveRange(room.RoomAmenities);
                    _context.RoomImages.RemoveRange(room.Images);
                }

                _context.Reviews.RemoveRange(hotel.Reviews);
                _context.HotelImages.RemoveRange(hotel.Images);
                hotel.Amenities.Clear();
                _context.Rooms.RemoveRange(hotel.Rooms);
                _context.Hotels.Remove(hotel);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            await _auditLogService.LogAsync("BulkRemoveNonAdminHotels", "Hotels", $"Bulk deleted {count} non-admin hotels.");
            return Ok(new { message = $"{count} non-admin hotels and associated data have been removed." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { message = "Error during bulk deletion.", error = ex.Message });
        }
    }
}