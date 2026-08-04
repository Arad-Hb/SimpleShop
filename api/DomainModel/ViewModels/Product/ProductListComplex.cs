namespace DomainModel.ViewModels.Product;

public class ProductListComplex
{
    public List<ProductListItem> Items { get; set; } = new();
    public ProductSearchModel SearchModel { get; set; } = new();
}
