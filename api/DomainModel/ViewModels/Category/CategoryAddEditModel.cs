using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Category;

public class CategoryAddEditModel
{
    public int Id { get; set; }

    [Required, StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(150)]
    public string? Slug { get; set; }

    [StringLength(200)]
    public string? MetaTitle { get; set; }

    [StringLength(500)]
    public string? MetaDescription { get; set; }

    public int? ImageFileId { get; set; }
}
