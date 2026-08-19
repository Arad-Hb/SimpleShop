using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Order;

public class CheckoutItemModel
{
    [Range(1, int.MaxValue, ErrorMessage = "محصول نامعتبر است.")]
    public int ProductId { get; set; }

    [Range(1, 100, ErrorMessage = "تعداد باید بین ۱ تا ۱۰۰ باشد.")]
    public int Quantity { get; set; }
}
