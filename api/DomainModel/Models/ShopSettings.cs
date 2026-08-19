namespace DomainModel.Models;

public class ShopSettings
{
    public int Id { get; set; }
    public string StoreName { get; set; } = "فروشگاه ساده تحلیل داده";
    public string? StoreDescription { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? Address { get; set; }
    public string Currency { get; set; } = "تومان";
    public int LowStockThreshold { get; set; } = 5;
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
    public DateTime UpdateDate { get; set; } = DateTime.Now;
}
