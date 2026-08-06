using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Order;

public class OrderCreateModel
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string? Status { get; set; }

    [StringLength(500)]
    public string? ShippingAddress { get; set; }

    public string PaymentStatus { get; set; } = "Unpaid";

    [MinLength(1)]
    public List<OrderLineCreateModel> Items { get; set; } = new();
}

public class OrderLineCreateModel
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}
