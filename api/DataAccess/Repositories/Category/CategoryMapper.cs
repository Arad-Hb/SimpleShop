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
            SortOrder = model.SortOrder,
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
        entity.SortOrder = model.SortOrder;
        entity.Slug = model.ResolvedSlug;
        entity.MetaTitle = TrimOrNull(model.MetaTitle) ?? model.Name.Trim();
        entity.MetaDescription = TrimOrNull(model.MetaDescription);
        entity.IsActive = model.IsActive;
        entity.UpdateDate = DateTime.Now;
    }

    public static CategoryListItem ToListItem(CategoryEntity entity)
        => new()
        {
            Id = entity.Id,
            Name = entity.Name,
            ParentId = entity.ParentId,
            ParentName = entity.Parent?.Name,
            SortOrder = entity.SortOrder,
            Slug = entity.Slug,
            IsActive = entity.IsActive,
            ProductCount = entity.Products?.Count ?? 0,
            ImagePath = entity.ImagePath,
            ThumbnailPath = entity.ThumbnailPath
        };

    public static CategoryDetailsModel ToDetails(CategoryEntity entity)
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
            ProductCount = entity.Products?.Count ?? 0,
            Children = entity.Children
                .OrderBy(x => x.SortOrder)
                .Select(ToListItem)
                .ToList()
        };

    public static CategoryMenuItem ToMenuItem(CategoryEntity entity)
        => new()
        {
            Id = entity.Id,
            Name = entity.Name,
            Slug = entity.Slug,
            ImagePath = entity.ImagePath,
            Children = entity.Children
                .Where(x => x.IsActive)
                .OrderBy(x => x.SortOrder)
                .Select(ToMenuItem)
                .ToList()
        };

    private static string? TrimOrNull(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
