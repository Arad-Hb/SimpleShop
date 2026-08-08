using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Product;

public class ProductImageAddModel
{
    [Required]
    public int FileManagerId { get; set; }

    [StringLength(200)]
    public string? AltText { get; set; }

    public bool IsPrimary { get; set; }
    public int SortOrder { get; set; }
}
