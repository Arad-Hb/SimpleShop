namespace DomainModel.ViewModels.Category;

public class CategoryMenuItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImagePath { get; set; }
    public List<CategoryMenuItem> Children { get; set; } = [];
}
