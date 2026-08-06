using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Order;

/// <summary>Checkout without JWT — finds or creates a Customer by mobile, then creates the order.</summary>
public class GuestCheckoutModel
{
    [Required]
    [StringLength(15, MinimumLength = 10)]
    public string Mobile { get; set; } = string.Empty;

    [StringLength(100)]
    public string? FirstName { get; set; }

    [StringLength(100)]
    public string? LastName { get; set; }

    [StringLength(500)]
    public string? ShippingAddress { get; set; }

    /// <summary>Required when mobile is new; ignored for existing customers in guest flow.</summary>
    [StringLength(100, MinimumLength = 6)]
    public string? Password { get; set; }

    [MinLength(1)]
    public List<OrderLineCreateModel> Items { get; set; } = new();
}
