using System.ComponentModel.DataAnnotations;
using Framework.Common.Seo;

namespace DomainModel.ViewModels.Product;

public class ProductAddEditModel
{
    [Required(ErrorMessage = "نام محصول الزامی است.")]
    [StringLength(180, ErrorMessage = "نام محصول حداکثر ۱۸۰ کاراکتر است.")]
    public string Name { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "قیمت نمی‌تواند منفی باشد.")]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "موجودی نمی‌تواند منفی باشد.")]
    public int Stock { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "حداقل موجودی نمی‌تواند منفی باشد.")]
    public int MinimumStock { get; set; } = 5;

    [Required(ErrorMessage = "دسته‌بندی الزامی است.")]
    [Range(1, int.MaxValue, ErrorMessage = "دسته‌بندی را انتخاب کنید.")]
    public int CategoryId { get; set; }

    [StringLength(80)]
    public string? BrandName { get; set; }

    public bool IsActive { get; set; } = true;
    public string? Slug { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }

    public string ResolvedSlug => SeoHelper.ToSlug(Slug) ?? SeoHelper.ToSlug(Name) ?? string.Empty;
}
