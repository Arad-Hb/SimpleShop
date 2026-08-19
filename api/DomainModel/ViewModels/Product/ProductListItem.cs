namespace DomainModel.ViewModels.Product;

public class ProductListItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int MinimumStock { get; set; }
    public bool IsLowStock { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? BrandName { get; set; }
    public bool IsActive { get; set; }
    public string? Slug { get; set; }
    public string? ImagePath { get; set; }
    public string? ThumbnailPath { get; set; }
}
