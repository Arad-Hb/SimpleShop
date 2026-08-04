namespace DomainModel.ViewModels.Category;

public class CategoryListComplex
{
    public List<CategoryListItem> Items { get; set; } = new();
    public CategorySearchModel SearchModel { get; set; } = new();
}
