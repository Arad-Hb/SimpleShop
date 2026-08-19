using Framework.Common;

namespace DomainModel.ViewModels.Customer;

public class CustomerSearchModel : PageModel
{
    public string? Term { get; set; }
    public bool? IsActive { get; set; }
}
