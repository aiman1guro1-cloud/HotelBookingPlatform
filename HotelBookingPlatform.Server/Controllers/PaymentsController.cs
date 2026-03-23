using HotelBookingPlatform.Core.DTOs;
using HotelBookingPlatform.Core.Interfaces;
using HotelBookingPlatform.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HotelBookingPlatform.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentsController> _logger;
    private readonly ApplicationDbContext _context;

    public PaymentsController(IPaymentService paymentService, ILogger<PaymentsController> logger, ApplicationDbContext context)
    {
        _paymentService = paymentService;
        _logger = logger;
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            throw new UnauthorizedAccessException("User not authenticated");
        return int.Parse(userIdClaim.Value);
    }

    [HttpPost("create-payment-intent/{bookingId}")]
    public async Task<ActionResult<PaymentIntentResponseDto>> CreatePaymentIntent(int bookingId)
    {
        try
        {
            // Verify ownership
            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking == null) return NotFound();

            var userId = GetCurrentUserId();
            if (booking.UserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var result = await _paymentService.CreatePaymentIntentAsync(bookingId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment intent");
            return StatusCode(500, new { message = "An error occurred processing your payment" });
        }
    }

    [HttpPost("confirm")]
    public async Task<ActionResult<bool>> ConfirmPayment(ConfirmPaymentDto confirmDto)
    {
        try
        {
            // Verify ownership
            var booking = await _context.Bookings.FindAsync(confirmDto.BookingId);
            if (booking == null) return NotFound();

            var userId = GetCurrentUserId();
            if (booking.UserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var result = await _paymentService.ConfirmPaymentAsync(confirmDto.BookingId, confirmDto.PaymentIntentId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming payment");
            return StatusCode(500, new { message = "An error occurred confirming your payment" });
        }
    }

    [HttpPost("refund/{bookingId}")]
    public async Task<ActionResult<bool>> RefundPayment(int bookingId)
    {
        try
        {
            // Verify ownership
            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking == null) return NotFound();

            var userId = GetCurrentUserId();
            if (booking.UserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var result = await _paymentService.RefundPaymentAsync(bookingId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refunding payment");
            return StatusCode(500, new { message = "An error occurred processing your refund" });
        }
    }
}