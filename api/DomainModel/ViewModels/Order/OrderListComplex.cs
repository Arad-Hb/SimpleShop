using Framework.Common;

namespace DomainModel.ViewModels.Order;

public class OrderListComplex
{
    public List<OrderListItem> Items { get; set; } = [];
    public PageModel Page { get; set; } = new();
}
