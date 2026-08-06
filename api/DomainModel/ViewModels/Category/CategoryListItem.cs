namespace DomainModel.ViewModels.Category;

public class CategoryListItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ProductCount { get; set; }
    public string? Slug { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? ImageUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public bool IsActive { get; set; }
    public int? ParentId { get; set; }
    public string? ParentName { get; set; }
    public int SortOrder { get; set; }
    public int Depth { get; set; }
    public int ChildCount { get; set; }
}
