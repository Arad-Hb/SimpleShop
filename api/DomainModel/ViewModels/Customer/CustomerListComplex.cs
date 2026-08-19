using Framework.Common;

namespace DomainModel.ViewModels.Customer;

public class CustomerListComplex
{
    public List<CustomerListItem> Items { get; set; } = [];
    public PageModel Page { get; set; } = new();
}
