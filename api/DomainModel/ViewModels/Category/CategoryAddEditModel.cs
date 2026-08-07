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

    [StringLength(500)]
    public string? MetaKeywords { get; set; }

    [StringLength(500)]
    public string? CanonicalUrl { get; set; }

    [StringLength(200)]
    public string? OgTitle { get; set; }

    [StringLength(500)]
    public string? OgDescription { get; set; }

    public int? ImageFileId { get; set; }
    public int? OgImageId { get; set; }

    /// <summary>Read-only on GET — primary image URL for admin preview.</summary>
    public string? ImageUrl { get; set; }

    /// <summary>Read-only on GET — OG image URL for admin preview.</summary>
    public string? OgImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>Null = root category.</summary>
    public int? ParentId { get; set; }

    /// <summary>Read-only on GET.</summary>
    public string? ParentName { get; set; }

    /// <summary>
    /// Desired display order among siblings (same <see cref="ParentId"/>).
    /// <c>null</c> or <c>0</c> means append at the end (next available SortOrder).
    /// </summary>
    public int? SortOrder { get; set; }

    /// <summary>When true, shift sibling SortOrders to insert at requested position.</summary>
    public bool ConfirmShiftSortOrder { get; set; }

    /// <summary>Computed hierarchy depth (read-only on GET).</summary>
    public int Depth { get; set; }

    /// <summary>Read-only on GET.</summary>
    public int ProductCount { get; set; }

    /// <summary>Read-only on GET.</summary>
    public int ChildCount { get; set; }

    /// <summary>Read-only on GET.</summary>
    public DateTime? CreatedAt { get; set; }
}
