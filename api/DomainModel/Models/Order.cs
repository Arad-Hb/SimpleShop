namespace DomainModel.Models;

public class Order
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; } = DateTime.Now;
    public string Status { get; set; } = "pending";
    public decimal TotalAmount { get; set; }
    public string ShippingFullName { get; set; } = string.Empty;
    public string ShippingMobile { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string? ShippingCity { get; set; }
    public string? ShippingPostalCode { get; set; }
    public string? CustomerNote { get; set; }

    public ApplicationUser User { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
