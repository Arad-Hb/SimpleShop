namespace DomainModel.ViewModels.Cart;

public class CartListComplex
{
    public List<CartItemListItem> Items { get; set; } = new();
    public CartSearchModel SearchModel { get; set; } = new();
    public decimal TotalAmount => Items.Sum(i => i.LineTotal);
}
