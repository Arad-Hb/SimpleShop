using Framework.Common;

namespace DomainModel.ViewModels.Product;

public class ProductSearchModel : PageModel
{
    public string? Term { get; set; }
    public int? CategoryId { get; set; }
    public bool? IsActive { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? InStock { get; set; }
    public string? Sort { get; set; }
}
