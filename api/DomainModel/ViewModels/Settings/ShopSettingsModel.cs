using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Settings;

public class ShopSettingsModel
{
    [Required, StringLength(200)]
    public string ShopName { get; set; } = "فروشگاه ساده تحلیل داده";

    [StringLength(1000)]
    public string? ShopDescription { get; set; }

    [StringLength(20)]
    public string? ContactPhone { get; set; }

    [EmailAddress, StringLength(100)]
    public string? ContactEmail { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    [StringLength(20)]
    public string Currency { get; set; } = "تومان";

    public int LowStockThreshold { get; set; } = 10;

    [StringLength(20)]
    public string ShopVisibility { get; set; } = "public";

    [StringLength(200)]
    public string? Instagram { get; set; }

    [StringLength(200)]
    public string? Telegram { get; set; }

    [StringLength(200)]
    public string? Whatsapp { get; set; }

    public bool InstagramEnabled { get; set; }
    public bool TelegramEnabled { get; set; }
    public bool WhatsappEnabled { get; set; }

    [StringLength(200)]
    public string? DefaultSeoTitle { get; set; }

    [StringLength(500)]
    public string? DefaultSeoDescription { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? LogoFileId { get; set; }
    public string? LogoUrl { get; set; }
    public string? LogoThumbnailUrl { get; set; }
    public int? FaviconFileId { get; set; }
    public string? FaviconUrl { get; set; }
    public int? OgImageFileId { get; set; }
    public string? OgImageUrl { get; set; }
}
