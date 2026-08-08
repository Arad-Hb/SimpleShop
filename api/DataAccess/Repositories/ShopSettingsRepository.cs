using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Settings;
using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

public class ShopSettingsRepository(SimpleShopDbContext db) : IShopSettingsRepository
{
    private static ShopSettingsModel ToViewModel(ShopSettings s) => new()
    {
        ShopName = s.ShopName,
        ShopDescription = s.ShopDescription,
        ContactPhone = s.ContactPhone,
        ContactEmail = s.ContactEmail,
        Address = s.Address,
        Currency = s.Currency,
        LowStockThreshold = s.LowStockThreshold,
        ShopVisibility = s.ShopVisibility,
        Instagram = s.Instagram,
        Telegram = s.Telegram,
        Whatsapp = s.Whatsapp,
        InstagramEnabled = s.InstagramEnabled,
        TelegramEnabled = s.TelegramEnabled,
        WhatsappEnabled = s.WhatsappEnabled,
        DefaultSeoTitle = s.DefaultSeoTitle,
        DefaultSeoDescription = s.DefaultSeoDescription,
        UpdatedAt = s.UpdatedAt
    };

    private async Task<ShopSettings> GetOrCreateEntityAsync()
    {
        var entity = await db.ShopSettings.OrderBy(x => x.Id).FirstOrDefaultAsync();
        if (entity != null)
            return entity;

        entity = new ShopSettings();
        db.ShopSettings.Add(entity);
        await db.SaveChangesAsync();
        return entity;
    }

    public async Task<ShopSettingsModel> Get()
    {
        var entity = await GetOrCreateEntityAsync();
        return ToViewModel(entity);
    }

    public async Task<OperationResult> Update(ShopSettingsModel model)
    {
        var entity = await GetOrCreateEntityAsync();

        entity.ShopName = model.ShopName.Trim();
        entity.ShopDescription = string.IsNullOrWhiteSpace(model.ShopDescription) ? null : model.ShopDescription.Trim();
        entity.ContactPhone = string.IsNullOrWhiteSpace(model.ContactPhone) ? null : model.ContactPhone.Trim();
        entity.ContactEmail = string.IsNullOrWhiteSpace(model.ContactEmail) ? null : model.ContactEmail.Trim();
        entity.Address = string.IsNullOrWhiteSpace(model.Address) ? null : model.Address.Trim();
        entity.Currency = string.IsNullOrWhiteSpace(model.Currency) ? "تومان" : model.Currency.Trim();
        entity.LowStockThreshold = model.LowStockThreshold < 0 ? 0 : model.LowStockThreshold;
        entity.ShopVisibility = model.ShopVisibility == "private" ? "private" : "public";
        entity.Instagram = string.IsNullOrWhiteSpace(model.Instagram) ? null : model.Instagram.Trim();
        entity.Telegram = string.IsNullOrWhiteSpace(model.Telegram) ? null : model.Telegram.Trim();
        entity.Whatsapp = string.IsNullOrWhiteSpace(model.Whatsapp) ? null : model.Whatsapp.Trim();
        entity.InstagramEnabled = model.InstagramEnabled;
        entity.TelegramEnabled = model.TelegramEnabled;
        entity.WhatsappEnabled = model.WhatsappEnabled;
        entity.DefaultSeoTitle = string.IsNullOrWhiteSpace(model.DefaultSeoTitle) ? null : model.DefaultSeoTitle.Trim();
        entity.DefaultSeoDescription = string.IsNullOrWhiteSpace(model.DefaultSeoDescription) ? null : model.DefaultSeoDescription.Trim();
        entity.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return new OperationResult(nameof(Update)).ToSuccess("تنظیمات ذخیره شد", entity.Id);
    }
}
