using HotelBookingPlatform.Core.Entities;
using HotelBookingPlatform.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelBookingPlatform.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AmenitiesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AmenitiesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Amenities
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Amenity>>> GetAmenities()
    {
        return await _context.Amenities.ToListAsync();
    }

    // GET: api/Amenities/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Amenity>> GetAmenity(int id)
    {
        var amenity = await _context.Amenities.FindAsync(id);

        if (amenity == null)
        {
            return NotFound();
        }

        return amenity;
    }

    // POST: api/Amenities
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Amenity>> CreateAmenity(Amenity amenity)
    {
        _context.Amenities.Add(amenity);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAmenity), new { id = amenity.Id }, amenity);
    }

    // DELETE: api/Amenities/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAmenity(int id)
    {
        var amenity = await _context.Amenities.FindAsync(id);
        if (amenity == null)
        {
            return NotFound();
        }

        _context.Amenities.Remove(amenity);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
