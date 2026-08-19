using DomainModel.ViewModels.Category;
using DomainModel.ViewModels.Product;

namespace DomainModel.ViewModels.Settings;

public class StoreHomeModel
{
    public PublicShopSettingsModel Settings { get; set; } = new();
    public List<CategoryMenuItem> Categories { get; set; } = [];
    public List<ProductListItem> LatestProducts { get; set; } = [];
}
