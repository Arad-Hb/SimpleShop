using ShopSettingsEntity = DomainModel.Models.ShopSettings;

namespace DataAccess.Repositories.ShopSettings;

public interface IShopSettingRepository
{
    Task<ShopSettingsEntity?> GetAsync(bool tracking = true);
    Task AddAsync(ShopSettingsEntity settings);
    Task<int> SaveChangesAsync();
}
