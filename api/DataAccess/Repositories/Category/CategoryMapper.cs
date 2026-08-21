using DomainModel.ViewModels.Category;
using CategoryEntity = DomainModel.Models.Category;

namespace DataAccess.Repositories.Categories;

public static class CategoryMapper
{
    public static CategoryEntity ToEntity(CategoryAddEditModel model)
        => new()
        {
            Name = model.Name.Trim(),
            Description = TrimOrNull(model.Description),
            ParentId = model.ParentId,
            Slug = model.ResolvedSlug,
            MetaTitle = TrimOrNull(model.MetaTitle) ?? model.Name.Trim(),
            MetaDescription = TrimOrNull(model.MetaDescription),
            IsActive = model.IsActive,
            CreateDate = DateTime.Now
        };

    public static void MapForUpdate(CategoryAddEditModel model, CategoryEntity entity)
    {
        entity.Name = model.Name.Trim();
        entity.Description = TrimOrNull(model.Description);
        entity.ParentId = model.ParentId;
        entity.Slug = model.ResolvedSlug;
        entity.MetaTitle = TrimOrNull(model.MetaTitle) ?? model.Name.Trim();
        entity.MetaDescription = TrimOrNull(model.MetaDescription);
        entity.IsActive = model.IsActive;
        entity.UpdateDate = DateTime.Now;
    }

    public static CategoryListItem ToListItem(CategoryEntity entity, int depth, int productCount, int childCount = 0)
        => new()
        {
            Id = entity.Id,
            Name = entity.Name,
            ParentId = entity.ParentId,
            ParentName = entity.Parent?.Name,
            SortOrder = entity.SortOrder,
            Slug = entity.Slug,
            IsActive = entity.IsActive,
            Depth = depth,
            ProductCount = productCount,
            ChildCount = childCount,
            ImagePath = entity.ImagePath,
            ThumbnailPath = entity.ThumbnailPath
        };

    public static CategoryDetailsModel ToDetails(
        CategoryEntity entity,
        int depth,
        int productCount,
        int inclusiveProductCount,
        bool canHaveChildren,
        List<CategoryListItem> breadcrumb,
        List<CategoryListItem> children)
        => new()
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            ParentId = entity.ParentId,
            ParentName = entity.Parent?.Name,
            SortOrder = entity.SortOrder,
            Slug = entity.Slug,
            MetaTitle = entity.MetaTitle,
            MetaDescription = entity.MetaDescription,
            ImagePath = entity.ImagePath,
            ThumbnailPath = entity.ThumbnailPath,
            IsActive = entity.IsActive,
            Depth = depth,
            ProductCount = productCount,
            InclusiveProductCount = inclusiveProductCount,
            ChildCount = children.Count,
            CanHaveChildren = canHaveChildren,
            Breadcrumb = breadcrumb,
            Children = children
        };

    public static CategoryMenuItem ToMenuItem(
        CategoryEntity entity,
        int depth,
        int productCount,
        int inclusiveProductCount)
        => new()
        {
            Id = entity.Id,
            Name = entity.Name,
            Slug = entity.Slug,
            ImagePath = entity.ImagePath,
            ParentId = entity.ParentId,
            SortOrder = entity.SortOrder,
            IsActive = entity.IsActive,
            Depth = depth,
            ProductCount = productCount,
            InclusiveProductCount = inclusiveProductCount
        };

    private static string? TrimOrNull(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
