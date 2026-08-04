using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Order;

public class OrderCreateModel
{
    [Required]
    public int CustomerId { get; set; }

    [StringLength(500)]
    public string? ShippingAddress { get; set; }
}
