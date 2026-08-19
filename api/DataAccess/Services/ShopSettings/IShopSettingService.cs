using DomainModel.ViewModels.Settings;
using Framework.Common;

namespace DataAccess.Services.ShopSettings;

public interface IShopSettingService
{
    Task<PublicShopSettingsModel> GetPublicAsync();
    Task<ShopSettingsEditModel> GetAdminAsync();
    Task<StoreHomeModel> GetHomeAsync();
    Task<OperationResult> UpdateAsync(ShopSettingsEditModel model);
    Task<OperationResult> UpdateLogoAsync(string path);
    Task<OperationResult> UpdateFaviconAsync(string path);
    Task<OperationResult> UpdateHeroImageAsync(string path);
    Task<string?> GetLogoPathAsync();
    Task<string?> GetFaviconPathAsync();
    Task<string?> GetHeroImagePathAsync();
}
