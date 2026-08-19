using Framework.Common;

namespace DomainModel.ViewModels.Order;

public class OrderSearchModel : PageModel
{
    public string? Term { get; set; }
    public string? Status { get; set; }
    public string? UserId { get; set; }
}
