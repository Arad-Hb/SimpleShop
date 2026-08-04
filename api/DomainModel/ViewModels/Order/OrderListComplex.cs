namespace DomainModel.ViewModels.Order;

public class OrderListComplex
{
    public List<OrderListItem> Items { get; set; } = new();
    public OrderSearchModel SearchModel { get; set; } = new();
}
