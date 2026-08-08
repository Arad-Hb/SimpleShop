using Framework.Common;

namespace DomainModel.ViewModels.User;

public class UserSearchModel : PageModel
{
    public string? Search { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
    public bool? HasOrders { get; set; }
}
