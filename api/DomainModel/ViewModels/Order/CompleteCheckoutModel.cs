using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Order;

/// <summary>After successful payment — register/find Customer, then create paid order.</summary>
public class CompleteCheckoutModel
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

    [StringLength(20)]
    public string? PostalCode { get; set; }

    /// <summary>Demo payment reference — required to confirm payment succeeded.</summary>
    [Required]
    [StringLength(100)]
    public string PaymentReference { get; set; } = string.Empty;

    [MinLength(1)]
    public List<OrderLineCreateModel> Items { get; set; } = new();
}
