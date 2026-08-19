namespace DomainModel.ViewModels.Order;

public class OrderDetailsModel
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerMobile { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public string OrderDatePersian { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusTitle { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string ShippingFullName { get; set; } = string.Empty;
    public string ShippingMobile { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string? ShippingCity { get; set; }
    public string? ShippingPostalCode { get; set; }
    public string? CustomerNote { get; set; }
    public bool CanCancel { get; set; }
    public List<OrderItemDetailsModel> Items { get; set; } = [];
}
