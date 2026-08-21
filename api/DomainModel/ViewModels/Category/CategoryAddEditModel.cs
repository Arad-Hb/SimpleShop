using System.ComponentModel.DataAnnotations;
using Framework.Common.Seo;

namespace DomainModel.ViewModels.Category;

public class CategoryAddEditModel
{
    public int Id { get; set; }

    [Required(ErrorMessage = "نام دسته‌بندی الزامی است.")]
    [StringLength(120, ErrorMessage = "نام دسته‌بندی حداکثر ۱۲۰ کاراکتر است.")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public int? ParentId { get; set; }

    /// <summary>
    /// Desired display order among siblings.
    /// CREATE: null or &lt;= 0 appends at the end.
    /// UPDATE: null keeps the current slot; &lt;= 0 appends. Parent change with null appends among the new siblings.
    /// </summary>
    public int? SortOrder { get; set; }

    /// <summary>When true, shift sibling SortOrders to insert at the requested position.</summary>
    public bool ConfirmShiftSortOrder { get; set; }

    public string? Slug { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public bool IsActive { get; set; } = true;

    /// <summary>Computed hierarchy depth (read-only on GET).</summary>
    public int Depth { get; set; }

    /// <summary>Direct product count (read-only on GET).</summary>
    public int ProductCount { get; set; }

    /// <summary>Direct child count (read-only on GET).</summary>
    public int ChildCount { get; set; }

    public string ResolvedSlug => SeoHelper.ToSlug(Slug) ?? SeoHelper.ToSlug(Name) ?? string.Empty;
}
