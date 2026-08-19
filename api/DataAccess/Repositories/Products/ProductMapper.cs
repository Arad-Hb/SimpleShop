using DomainModel.ViewModels.Product;
using Framework.Common.Seo;
using ProductEntity = DomainModel.Models.Product;

namespace DataAccess.Repositories.Products;

public static class ProductMapper
{
    public static ProductEntity ToEntity(ProductAddEditModel model)
        => new()
        {
            Name = model.Name.Trim(),
            Description = TrimOrNull(model.Description),
            Price = model.Price,
            Stock = model.Stock,
            MinimumStock = model.MinimumStock,
            CategoryId = model.CategoryId,
            BrandName = TrimOrNull(model.BrandName),
            IsActive = model.IsActive,
            Slug = model.ResolvedSlug,
            MetaTitle = TrimOrNull(model.MetaTitle) ?? model.Name.Trim(),
            MetaDescription = TrimOrNull(model.MetaDescription) ?? SeoHelper.BuildDefaultDescription(model.Description),
            CreateDate = DateTime.Now
        };

    public static void MapForUpdate(ProductAddEditModel model, ProductEntity entity)
    {
        entity.Name = model.Name.Trim();
        entity.Description = TrimOrNull(model.Description);
        entity.Price = model.Price;
        entity.Stock = model.Stock;
        entity.MinimumStock = model.MinimumStock;
        entity.CategoryId = model.CategoryId;
        entity.BrandName = TrimOrNull(model.BrandName);
        entity.IsActive = model.IsActive;
        entity.Slug = model.ResolvedSlug;
        entity.MetaTitle = TrimOrNull(model.MetaTitle) ?? model.Name.Trim();
        entity.MetaDescription = TrimOrNull(model.MetaDescription) ?? SeoHelper.BuildDefaultDescription(model.Description);
        entity.UpdateDate = DateTime.Now;
    }

    public static ProductListItem ToListItem(ProductEntity entity)
        => new()
        {
            Id = entity.Id,
            Name = entity.Name,
            Price = entity.Price,
            Stock = entity.Stock,
            MinimumStock = entity.MinimumStock,
            IsLowStock = entity.Stock <= entity.MinimumStock,
            CategoryId = entity.CategoryId,
            CategoryName = entity.Category?.Name ?? string.Empty,
            BrandName = entity.BrandName,
            IsActive = entity.IsActive,
            Slug = entity.Slug,
            ImagePath = entity.ImagePath,
            ThumbnailPath = entity.ThumbnailPath
        };

    public static ProductDetailsModel ToDetails(ProductEntity entity)
        => new()
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            Price = entity.Price,
            Stock = entity.Stock,
            MinimumStock = entity.MinimumStock,
            IsLowStock = entity.Stock <= entity.MinimumStock,
            CategoryId = entity.CategoryId,
            CategoryName = entity.Category?.Name ?? string.Empty,
            CategorySlug = entity.Category?.Slug,
            ParentCategoryId = entity.Category?.ParentId,
            ParentCategoryName = entity.Category?.Parent?.Name,
            BrandName = entity.BrandName,
            IsActive = entity.IsActive,
            Slug = entity.Slug,
            MetaTitle = entity.MetaTitle,
            MetaDescription = entity.MetaDescription,
            ImagePath = entity.ImagePath,
            ThumbnailPath = entity.ThumbnailPath,
            OgTitle = entity.MetaTitle ?? entity.Name,
            OgDescription = SeoHelper.BuildDefaultDescription(entity.MetaDescription ?? entity.Description),
            OgImagePath = entity.ImagePath
        };

    private static string? TrimOrNull(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
