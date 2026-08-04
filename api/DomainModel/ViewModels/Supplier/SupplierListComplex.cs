namespace DomainModel.ViewModels.Supplier;

public class SupplierListComplex
{
    public List<SupplierListItem> Items { get; set; } = new();
    public SupplierSearchModel SearchModel { get; set; } = new();
}
