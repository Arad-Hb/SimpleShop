using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Product;

public class ProductAddEditModel
{
    public int Id { get; set; }

    [Required, StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue)]
    public int Stock { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public int? SupplierId { get; set; }

    [StringLength(220)]
    public string? Slug { get; set; }

    [StringLength(200)]
    public string? MetaTitle { get; set; }

    [StringLength(500)]
    public string? MetaDescription { get; set; }

    [StringLength(500)]
    public string? MetaKeywords { get; set; }

    [StringLength(500)]
    public string? CanonicalUrl { get; set; }

    [StringLength(200)]
    public string? OgTitle { get; set; }

    [StringLength(500)]
    public string? OgDescription { get; set; }

    public int? PrimaryImageId { get; set; }
    public int? OgImageId { get; set; }
}
