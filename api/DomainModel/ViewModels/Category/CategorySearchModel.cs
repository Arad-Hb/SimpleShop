using Framework.Common;

namespace DomainModel.ViewModels.Category;

public class CategorySearchModel : PageModel
{
    public string? Term { get; set; }
    public int? ParentId { get; set; }
    public bool? IsActive { get; set; }
}
