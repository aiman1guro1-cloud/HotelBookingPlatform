using HotelBookingPlatform.Core.DTOs;
using HotelBookingPlatform.Core.Interfaces;
using HotelBookingPlatform.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelBookingPlatform.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IPasswordService _passwordService;

    public AuthController(IAuthService authService, ILogger<AuthController> logger,
        ApplicationDbContext context, IPasswordService passwordService)
    {
        _authService = authService;
        _logger = logger;
        _context = context;
        _passwordService = passwordService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.RegisterAsync(registerDto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration error");
            return StatusCode(500, new { message = "An error occurred during registration" });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.LoginAsync(loginDto);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login error");
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    // POST: api/Auth/forgot-password
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        // Always return 200 to avoid user enumeration attacks
        if (user == null)
            return Ok(new { message = "If that email exists, a reset token has been generated." });

        // Generate a secure 6-character alphanumeric token
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("/", "").Replace("+", "").Replace("=", "")[..8].ToUpper();

        user.PasswordResetToken = token;
        user.PasswordResetExpiry = DateTime.UtcNow.AddMinutes(15);
        await _context.SaveChangesAsync();

        // In production: send token via email. For dev: return in response.
        return Ok(new
        {
            message = "Password reset token generated. Use this token to reset your password.",
            resetToken = token, // ⚠️ In production, remove this and email it instead
            expiresAt = user.PasswordResetExpiry,
            note = "This token expires in 15 minutes."
        });
    }

    // POST: api/Auth/reset-password
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user == null ||
            user.PasswordResetToken == null ||
            user.PasswordResetToken != dto.Token ||
            user.PasswordResetExpiry == null ||
            user.PasswordResetExpiry < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Invalid or expired reset token. Please request a new one." });
        }

        // Update password
        user.PasswordHash = _passwordService.HashPassword(dto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Password reset successfully! You can now log in with your new password." });
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult GetMe()
    {        var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
        return Ok(new
        {            IsAuthenticated = User.Identity?.IsAuthenticated,
            UserName = User.Identity?.Name,
            Claims = claims
        });
    }
}