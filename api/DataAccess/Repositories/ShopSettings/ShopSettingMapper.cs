using DomainModel.ViewModels.Settings;
using ShopSettingsEntity = DomainModel.Models.ShopSettings;

namespace DataAccess.Repositories.ShopSettings;

public static class ShopSettingMapper
{
    public static PublicShopSettingsModel ToPublic(ShopSettingsEntity entity)
        => new()
        {
            StoreName = entity.StoreName,
            StoreDescription = entity.StoreDescription,
            ContactPhone = entity.ContactPhone,
            ContactEmail = entity.ContactEmail,
            Address = entity.Address,
            Currency = entity.Currency,
            InstagramUrl = EmptyToNull(entity.InstagramUrl),
            TelegramUrl = EmptyToNull(entity.TelegramUrl),
            WhatsAppUrl = EmptyToNull(entity.WhatsAppUrl),
            DefaultSeoTitle = entity.DefaultSeoTitle,
            DefaultSeoDescription = entity.DefaultSeoDescription,
            LogoPath = entity.LogoPath,
            FaviconPath = entity.FaviconPath,
            HeroImagePath = entity.HeroImagePath,
            HeroTitle = entity.HeroTitle,
            HeroSubtitle = entity.HeroSubtitle
        };

    public static ShopSettingsEditModel ToEdit(ShopSettingsEntity entity)
        => new()
        {
            StoreName = entity.StoreName,
            StoreDescription = entity.StoreDescription,
            ContactPhone = entity.ContactPhone,
            ContactEmail = entity.ContactEmail,
            Address = entity.Address,
            Currency = entity.Currency,
            LowStockThreshold = entity.LowStockThreshold,
            InstagramUrl = entity.InstagramUrl,
            TelegramUrl = entity.TelegramUrl,
            WhatsAppUrl = entity.WhatsAppUrl,
            DefaultSeoTitle = entity.DefaultSeoTitle,
            DefaultSeoDescription = entity.DefaultSeoDescription,
            HeroTitle = entity.HeroTitle,
            HeroSubtitle = entity.HeroSubtitle,
            LogoPath = entity.LogoPath,
            FaviconPath = entity.FaviconPath,
            HeroImagePath = entity.HeroImagePath
        };

    public static void MapForUpdate(ShopSettingsEditModel model, ShopSettingsEntity entity)
    {
        entity.StoreName = model.StoreName.Trim();
        entity.StoreDescription = TrimOrNull(model.StoreDescription);
        entity.ContactPhone = TrimOrNull(model.ContactPhone);
        entity.ContactEmail = TrimOrNull(model.ContactEmail);
        entity.Address = TrimOrNull(model.Address);
        entity.Currency = string.IsNullOrWhiteSpace(model.Currency) ? "تومان" : model.Currency.Trim();
        entity.LowStockThreshold = model.LowStockThreshold;
        entity.InstagramUrl = TrimOrNull(model.InstagramUrl);
        entity.TelegramUrl = TrimOrNull(model.TelegramUrl);
        entity.WhatsAppUrl = TrimOrNull(model.WhatsAppUrl);
        entity.DefaultSeoTitle = TrimOrNull(model.DefaultSeoTitle);
        entity.DefaultSeoDescription = TrimOrNull(model.DefaultSeoDescription);
        entity.HeroTitle = TrimOrNull(model.HeroTitle);
        entity.HeroSubtitle = TrimOrNull(model.HeroSubtitle);
        entity.UpdateDate = DateTime.Now;
    }

    private static string? TrimOrNull(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? EmptyToNull(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
