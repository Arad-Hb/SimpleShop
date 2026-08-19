using Framework.Common;

namespace DomainModel.ViewModels.Product;

public class ProductListComplex
{
    public List<ProductListItem> Items { get; set; } = [];
    public PageModel Page { get; set; } = new();
}
