using System.ComponentModel.DataAnnotations;
using Framework.Common.Seo;

namespace DomainModel.ViewModels.Category;

public class CategoryAddEditModel
{
    [Required(ErrorMessage = "نام دسته‌بندی الزامی است.")]
    [StringLength(120, ErrorMessage = "نام دسته‌بندی حداکثر ۱۲۰ کاراکتر است.")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public int? ParentId { get; set; }

    [Range(0, 1000, ErrorMessage = "ترتیب نمایش معتبر نیست.")]
    public int SortOrder { get; set; }

    public string? Slug { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public bool IsActive { get; set; } = true;

    public string ResolvedSlug => SeoHelper.ToSlug(Slug) ?? SeoHelper.ToSlug(Name) ?? string.Empty;
}
