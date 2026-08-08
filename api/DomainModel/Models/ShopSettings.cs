namespace DomainModel.Models;

/// <summary>Single-row shop configuration (Id = 1).</summary>
public class ShopSettings
{
    public int Id { get; set; }
    public string ShopName { get; set; } = "فروشگاه ساده تحلیل داده";
    public string? ShopDescription { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? Address { get; set; }
    public string Currency { get; set; } = "تومان";
    public int LowStockThreshold { get; set; } = 10;
    public string ShopVisibility { get; set; } = "public";
    public string? Instagram { get; set; }
    public string? Telegram { get; set; }
    public string? Whatsapp { get; set; }
    public bool InstagramEnabled { get; set; }
    public bool TelegramEnabled { get; set; }
    public bool WhatsappEnabled { get; set; }
    public string? DefaultSeoTitle { get; set; }
    public string? DefaultSeoDescription { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public int? LogoFileId { get; set; }
    public FileManager? LogoFile { get; set; }
    public int? FaviconFileId { get; set; }
    public FileManager? FaviconFile { get; set; }
    public int? OgImageFileId { get; set; }
    public FileManager? OgImageFile { get; set; }
}
