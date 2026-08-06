using Framework.Common;

namespace DomainModel.ViewModels.Order;

public class OrderSearchModel : PageModel
{
    public string? UserId { get; set; }
    public string? Status { get; set; }
}
