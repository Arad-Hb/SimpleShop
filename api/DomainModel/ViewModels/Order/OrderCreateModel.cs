using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Order;

public class OrderCreateModel
{
    [Required(ErrorMessage = "نام گیرنده الزامی است.")]
    [StringLength(120)]
    public string ShippingFullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "موبایل گیرنده الزامی است.")]
    [StringLength(15)]
    public string ShippingMobile { get; set; } = string.Empty;

    [Required(ErrorMessage = "آدرس ارسال الزامی است.")]
    [StringLength(400)]
    public string ShippingAddress { get; set; } = string.Empty;

    [StringLength(80)]
    public string? ShippingCity { get; set; }

    [StringLength(20)]
    public string? ShippingPostalCode { get; set; }

    [StringLength(500)]
    public string? CustomerNote { get; set; }

    [MinLength(1, ErrorMessage = "سبد خرید خالی است.")]
    public List<CheckoutItemModel> Items { get; set; } = [];
}
