using DomainModel.Context;
using Microsoft.EntityFrameworkCore;
using ShopSettingsEntity = DomainModel.Models.ShopSettings;

namespace DataAccess.Repositories.ShopSettings;

public class ShopSettingRepository(ApplicationDbContext context) : IShopSettingRepository
{
    public Task<ShopSettingsEntity?> GetAsync(bool tracking = true)
    {
        var query = tracking ? context.ShopSettings : context.ShopSettings.AsNoTracking();
        return query.FirstOrDefaultAsync();
    }

    public Task AddAsync(ShopSettingsEntity settings) => context.ShopSettings.AddAsync(settings).AsTask();

    public Task<int> SaveChangesAsync() => context.SaveChangesAsync();
}
