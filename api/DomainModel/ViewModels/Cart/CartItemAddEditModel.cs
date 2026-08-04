using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Cart;

public class CartItemAddEditModel
{
    public int Id { get; set; }

    [Required]
    public int CustomerId { get; set; }

    [Required]
    public int ProductId { get; set; }

    [Range(1, 1000)]
    public int Quantity { get; set; } = 1;
}
