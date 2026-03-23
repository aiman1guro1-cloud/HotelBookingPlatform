using AutoMapper;
using HotelBookingPlatform.Core.DTOs;
using HotelBookingPlatform.Core.Entities;
using HotelBookingPlatform.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HotelBookingPlatform.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ProfileController> _logger;

    public ProfileController(ApplicationDbContext context, IMapper mapper, ILogger<ProfileController> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            throw new UnauthorizedAccessException("User not authenticated");
        return int.Parse(userIdClaim.Value);
    }

    [HttpGet]
    public async Task<ActionResult<UserProfileDto>> GetProfile()
    {
        var userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        return Ok(_mapper.Map<UserProfileDto>(user));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile(UpdateUserProfileDto dto)
    {
        var userId = GetCurrentUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        _mapper.Map(dto, user);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("payment-methods")]
    public async Task<ActionResult<IEnumerable<UserPaymentMethodDto>>> GetPaymentMethods()
    {
        var userId = GetCurrentUserId();
        var methods = await _context.UserPaymentMethods
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.IsDefault)
            .ToListAsync();

        return Ok(_mapper.Map<IEnumerable<UserPaymentMethodDto>>(methods));
    }

    [HttpPost("payment-methods")]
    public async Task<ActionResult<UserPaymentMethodDto>> AddPaymentMethod(AddPaymentMethodDto dto)
    {
        var userId = GetCurrentUserId();
        
        // If this is the first method or explicitly set as default, unset others
        if (dto.IsDefault || !await _context.UserPaymentMethods.AnyAsync(m => m.UserId == userId))
        {
            var existingDefaults = await _context.UserPaymentMethods
                .Where(m => m.UserId == userId && m.IsDefault)
                .ToListAsync();
            foreach (var m in existingDefaults) m.IsDefault = false;
            dto.IsDefault = true;
        }

        var method = _mapper.Map<UserPaymentMethod>(dto);
        method.UserId = userId;
        method.CreatedAt = DateTime.UtcNow;

        _context.UserPaymentMethods.Add(method);
        await _context.SaveChangesAsync();

        return Ok(_mapper.Map<UserPaymentMethodDto>(method));
    }

    [HttpDelete("payment-methods/{id}")]
    public async Task<IActionResult> DeletePaymentMethod(int id)
    {
        var userId = GetCurrentUserId();
        var method = await _context.UserPaymentMethods.FindAsync(id);
        
        if (method == null || method.UserId != userId)
            return NotFound();

        _context.UserPaymentMethods.Remove(method);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
