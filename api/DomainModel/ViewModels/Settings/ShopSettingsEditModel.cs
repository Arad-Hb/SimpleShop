using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Settings;

public class ShopSettingsEditModel
{
    [Required(ErrorMessage = "نام فروشگاه الزامی است.")]
    [StringLength(120)]
    public string StoreName { get; set; } = string.Empty;

    [StringLength(500)]
    public string? StoreDescription { get; set; }

    [StringLength(30)]
    public string? ContactPhone { get; set; }

    [StringLength(120)]
    public string? ContactEmail { get; set; }

    [StringLength(400)]
    public string? Address { get; set; }

    [Required(ErrorMessage = "واحد پول الزامی است.")]
    [StringLength(30)]
    public string Currency { get; set; } = "تومان";

    [Range(0, 10000, ErrorMessage = "آستانه موجودی کم معتبر نیست.")]
    public int LowStockThreshold { get; set; } = 5;

    [StringLength(200)]
    public string? InstagramUrl { get; set; }

    [StringLength(200)]
    public string? TelegramUrl { get; set; }

    [StringLength(200)]
    public string? WhatsAppUrl { get; set; }

    [StringLength(180)]
    public string? DefaultSeoTitle { get; set; }

    [StringLength(320)]
    public string? DefaultSeoDescription { get; set; }

    [StringLength(180)]
    public string? HeroTitle { get; set; }

    [StringLength(320)]
    public string? HeroSubtitle { get; set; }

    public string? LogoPath { get; set; }
    public string? FaviconPath { get; set; }
    public string? HeroImagePath { get; set; }
}
