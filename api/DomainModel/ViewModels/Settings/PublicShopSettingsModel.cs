namespace DomainModel.ViewModels.Settings;

public class PublicShopSettingsModel
{
    public string StoreName { get; set; } = string.Empty;
    public string? StoreDescription { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? Address { get; set; }
    public string Currency { get; set; } = "تومان";
    public string? InstagramUrl { get; set; }
    public string? TelegramUrl { get; set; }
    public string? WhatsAppUrl { get; set; }
    public string? DefaultSeoTitle { get; set; }
    public string? DefaultSeoDescription { get; set; }
    public string? LogoPath { get; set; }
    public string? FaviconPath { get; set; }
    public string? HeroImagePath { get; set; }
    public string? HeroTitle { get; set; }
    public string? HeroSubtitle { get; set; }
}
