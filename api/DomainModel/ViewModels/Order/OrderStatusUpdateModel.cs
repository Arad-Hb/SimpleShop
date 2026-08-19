using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Order;

public class OrderStatusUpdateModel
{
    [Required(ErrorMessage = "وضعیت سفارش الزامی است.")]
    public string Status { get; set; } = string.Empty;
}
