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
    public int? ImageFileId { get; set; }
    public FileManager? ImageFile { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
