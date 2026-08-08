using DomainModel.ViewModels.Settings;
using Framework.Common;

namespace DataAccess.Services;

public interface IShopSettingsRepository
{
    Task<ShopSettingsModel> Get();
    Task<OperationResult> Update(ShopSettingsModel model);
}
