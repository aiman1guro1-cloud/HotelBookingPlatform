using HotelBookingPlatform.Core.Entities.Base;

namespace HotelBookingPlatform.Core.Entities;

public class UserPaymentMethod : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string CardHolderName { get; set; } = string.Empty;
    public string CardNumberMasked { get; set; } = string.Empty; // e.g. **** **** **** 1234
    public string ExpiryDate { get; set; } = string.Empty; // MM/YY
    public string Provider { get; set; } = string.Empty; // e.g. Visa, MasterCard
    public bool IsDefault { get; set; }
    public string StripePaymentMethodId { get; set; } = string.Empty;
}
