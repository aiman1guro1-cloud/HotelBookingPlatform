using System.ComponentModel.DataAnnotations;

namespace HotelBookingPlatform.Core.DTOs;

public class UserProfileDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? ProfileImageUrl { get; set; }
}

public class UpdateUserProfileDto
{
    [Required]
    public string FirstName { get; set; } = string.Empty;
    [Required]
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
}

public class UserPaymentMethodDto
{
    public int Id { get; set; }
    public string CardHolderName { get; set; } = string.Empty;
    public string CardNumberMasked { get; set; } = string.Empty;
    public string ExpiryDate { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class AddPaymentMethodDto
{
    [Required]
    public string StripePaymentMethodId { get; set; } = string.Empty;
    [Required]
    public string CardHolderName { get; set; } = string.Empty;
    [Required]
    public string CardNumberMasked { get; set; } = string.Empty;
    [Required]
    public string ExpiryDate { get; set; } = string.Empty;
    [Required]
    public string Provider { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}
