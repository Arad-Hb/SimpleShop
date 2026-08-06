namespace DomainModel.ViewModels.Category;

public class CategoryTreeNode
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public int SortOrder { get; set; }
    public int Depth { get; set; }
    public bool IsActive { get; set; }
    public int ProductCount { get; set; }
    public string? Slug { get; set; }
    public List<CategoryTreeNode> Children { get; set; } = new();
}
