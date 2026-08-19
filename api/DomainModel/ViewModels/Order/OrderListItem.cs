namespace DomainModel.ViewModels.Order;

public class OrderListItem
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
    public int ItemCount { get; set; }
}
