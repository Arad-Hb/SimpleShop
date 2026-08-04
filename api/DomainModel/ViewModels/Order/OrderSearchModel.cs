using Framework.Common;

namespace DomainModel.ViewModels.Order;

public class OrderSearchModel : PageModel
{
    public int? CustomerId { get; set; }
    public string? Status { get; set; }
}
