using Framework.Common;

namespace DomainModel.ViewModels.Category;

public class CategoryListComplex
{
    public List<CategoryListItem> Items { get; set; } = [];
    public PageModel Page { get; set; } = new();
}
