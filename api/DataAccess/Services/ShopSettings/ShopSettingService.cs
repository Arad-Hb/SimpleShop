using DataAccess.Repositories.ShopSettings;
using DataAccess.Services.Categories;
using DataAccess.Services.Products;
using DomainModel.ViewModels.Settings;
using Framework.Common;
using ShopSettingsEntity = DomainModel.Models.ShopSettings;

namespace DataAccess.Services.ShopSettings;

public class ShopSettingService(
    IShopSettingRepository repository,
    ICategoryService categoryService,
    IProductService productService) : IShopSettingService
{
    public async Task<PublicShopSettingsModel> GetPublicAsync()
        => ShopSettingMapper.ToPublic(await GetOrCreateAsync(tracking: false));

    public async Task<ShopSettingsEditModel> GetAdminAsync()
        => ShopSettingMapper.ToEdit(await GetOrCreateAsync(tracking: false));

    public async Task<StoreHomeModel> GetHomeAsync()
        => new()
        {
            Settings = await GetPublicAsync(),
            Categories = await categoryService.GetMenuAsync(),
            LatestProducts = await productService.GetLatestAsync(8)
        };

    public async Task<OperationResult> UpdateAsync(ShopSettingsEditModel model)
    {
        var result = new OperationResult("تنظیمات فروشگاه");
        var entity = await GetOrCreateAsync(tracking: true);
        ShopSettingMapper.MapForUpdate(model, entity);
        await repository.SaveChangesAsync();
        return result.ToSuccess("تنظیمات فروشگاه ذخیره شد.");
    }

    public Task<OperationResult> UpdateLogoAsync(string path) => UpdatePathAsync(path, (s, p) => s.LogoPath = p, "لوگو");
    public Task<OperationResult> UpdateFaviconAsync(string path) => UpdatePathAsync(path, (s, p) => s.FaviconPath = p, "فاوآیکون");
    public Task<OperationResult> UpdateHeroImageAsync(string path) => UpdatePathAsync(path, (s, p) => s.HeroImagePath = p, "تصویر اصلی");

    public async Task<string?> GetLogoPathAsync() => (await GetOrCreateAsync(false)).LogoPath;
    public async Task<string?> GetFaviconPathAsync() => (await GetOrCreateAsync(false)).FaviconPath;
    public async Task<string?> GetHeroImagePathAsync() => (await GetOrCreateAsync(false)).HeroImagePath;

    private async Task<OperationResult> UpdatePathAsync(string path, Action<ShopSettingsEntity, string> assign, string title)
    {
        var result = new OperationResult($"تصویر {title}");
        var entity = await GetOrCreateAsync(tracking: true);
        assign(entity, path);
        entity.UpdateDate = DateTime.Now;
        await repository.SaveChangesAsync();
        return result.ToSuccess($"{title} ذخیره شد.");
    }

    private async Task<ShopSettingsEntity> GetOrCreateAsync(bool tracking)
    {
        var entity = await repository.GetAsync(tracking);
        if (entity is not null)
            return entity;

        entity = new ShopSettingsEntity
        {
            StoreName = "فروشگاه ساده تحلیل داده",
            StoreDescription = "فروشگاه آموزشی دوره اول برنامه‌نویسی وب",
            Currency = "تومان",
            LowStockThreshold = 5,
            DefaultSeoTitle = "فروشگاه ساده تحلیل داده",
            DefaultSeoDescription = "خرید آموزشی محصولات با ASP.NET و JavaScript",
            HeroTitle = "خرید ساده و آموزشی",
            HeroSubtitle = "محصولات نمونه برای یادگیری فروشگاه اینترنتی"
        };
        await repository.AddAsync(entity);
        await repository.SaveChangesAsync();
        return entity;
    }
}
