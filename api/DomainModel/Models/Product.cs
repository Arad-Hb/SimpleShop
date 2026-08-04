namespace DomainModel.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int CategoryId { get; set; }
    public int? SupplierId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // SEO
    public string? Slug { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? MetaKeywords { get; set; }
    public string? CanonicalUrl { get; set; }
    public string? OgTitle { get; set; }
    public string? OgDescription { get; set; }

    /// <summary>Primary display image (FileManager).</summary>
    public int? PrimaryImageId { get; set; }
    public FileManager? PrimaryImage { get; set; }

    /// <summary>Open Graph / social share image.</summary>
    public int? OgImageId { get; set; }
    public FileManager? OgImage { get; set; }

    public Category Category { get; set; } = null!;
    public Supplier? Supplier { get; set; }
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
}
