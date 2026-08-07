namespace DomainModel.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    // SEO + image
    public string? Slug { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? MetaKeywords { get; set; }
    public string? CanonicalUrl { get; set; }
    public string? OgTitle { get; set; }
    public string? OgDescription { get; set; }
    public int? ImageFileId { get; set; }
    public FileManager? ImageFile { get; set; }
    public int? OgImageId { get; set; }
    public FileManager? OgImage { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Null = root category.</summary>
    public int? ParentId { get; set; }
    public Category? Parent { get; set; }
    public ICollection<Category> Children { get; set; } = new List<Category>();

    /// <summary>Display order among siblings (same ParentId).</summary>
    public int SortOrder { get; set; }

    /// <summary>0 = root; child depth = parent.Depth + 1.</summary>
    public int Depth { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
