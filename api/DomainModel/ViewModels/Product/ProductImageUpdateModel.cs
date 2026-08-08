using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Product;

public class ProductImageUpdateModel
{
    [StringLength(200)]
    public string? AltText { get; set; }

    public bool? IsPrimary { get; set; }
    public int? SortOrder { get; set; }
}
