using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Category;
using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

public class CategoryRepository(SimpleShopDbContext db) : ICategoryRepository
{
    private static void ApplyModel(Category entity, CategoryAddEditModel model)
    {
        entity.Name = model.Name;
        entity.Description = model.Description;
        entity.Slug = model.Slug;
        entity.MetaTitle = model.MetaTitle;
        entity.MetaDescription = model.MetaDescription;
        entity.MetaKeywords = model.MetaKeywords;
        entity.CanonicalUrl = model.CanonicalUrl;
        entity.OgTitle = model.OgTitle;
        entity.OgDescription = model.OgDescription;
        entity.ImageFileId = model.ImageFileId;
        entity.OgImageId = model.OgImageId;
        entity.IsActive = model.IsActive;
        entity.ParentId = model.ParentId;
    }

    private static CategoryAddEditModel ToViewModel(Category c, int childCount = 0, string? parentName = null) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        Slug = c.Slug,
        MetaTitle = c.MetaTitle,
        MetaDescription = c.MetaDescription,
        MetaKeywords = c.MetaKeywords,
        CanonicalUrl = c.CanonicalUrl,
        OgTitle = c.OgTitle,
        OgDescription = c.OgDescription,
        ImageFileId = c.ImageFileId,
        OgImageId = c.OgImageId,
        ImageUrl = c.ImageFile?.Url,
        OgImageUrl = c.OgImage?.Url,
        IsActive = c.IsActive,
        ParentId = c.ParentId,
        ParentName = parentName ?? c.Parent?.Name,
        SortOrder = c.SortOrder,
        Depth = c.Depth,
        ProductCount = c.Products?.Count ?? 0,
        ChildCount = childCount,
        CreatedAt = c.CreatedAt
    };

    private static CategoryListItem ToListItem(Category c, int childCount, string? parentName) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        ProductCount = c.Products?.Count ?? 0,
        Slug = c.Slug,
        MetaTitle = c.MetaTitle,
        MetaDescription = c.MetaDescription,
        ImageUrl = c.ImageFile?.Url,
        ThumbnailUrl = c.ImageFile?.ThumbnailUrl,
        OgImageUrl = c.OgImage?.Url,
        IsActive = c.IsActive,
        ParentId = c.ParentId,
        ParentName = parentName,
        SortOrder = c.SortOrder,
        Depth = c.Depth,
        ChildCount = childCount,
        CreatedAt = c.CreatedAt
    };

    private async Task<Dictionary<int, Category>> LoadLookupAsync()
        => await db.Categories.AsNoTracking().ToDictionaryAsync(c => c.Id);

    private async Task<int> ResolveDepthAsync(int? parentId)
    {
        if (parentId is null) return 0;

        var parentDepth = await db.Categories.AsNoTracking()
            .Where(c => c.Id == parentId.Value)
            .Select(c => (int?)c.Depth)
            .FirstOrDefaultAsync();

        return parentDepth.HasValue
            ? CategoryHierarchyRules.ComputeChildDepth(parentId, parentDepth.Value)
            : 0;
    }

    private async Task CascadeDepthToDescendantsAsync(int parentId, int parentDepth)
    {
        var children = await db.Categories.Where(c => c.ParentId == parentId).ToListAsync();
        foreach (var child in children)
        {
            child.Depth = parentDepth + 1;
            await CascadeDepthToDescendantsAsync(child.Id, child.Depth);
        }
    }

    private async Task<string?> ValidateParentAsync(int? parentId, int? excludeId)
    {
        if (parentId is null) return null;

        if (excludeId.HasValue && parentId == excludeId)
            return "دسته نمی‌تواند والد خودش باشد.";

        var lookup = await LoadLookupAsync();
        if (!lookup.TryGetValue(parentId.Value, out var parent))
            return "دسته والد یافت نشد.";

        if (!CategoryHierarchyRules.IsValidParentDepth(parent.Depth))
            return $"حداکثر {CategoryHierarchyRules.MaxDepth} زیرلایه مجاز است — این سطح دیگر نمی‌تواند زیردسته داشته باشد.";

        if (excludeId.HasValue && IsDescendant(excludeId.Value, parentId.Value, lookup))
            return "انتخاب این والد باعث حلقه در درخت دسته‌بندی می‌شود.";

        return null;
    }

    private async Task<string?> ValidateSlugAsync(string? slug, int? excludeId)
    {
        if (string.IsNullOrWhiteSpace(slug)) return null;

        var normalized = slug.Trim();
        var exists = await db.Categories.AsNoTracking()
            .AnyAsync(c => c.Slug == normalized && (!excludeId.HasValue || c.Id != excludeId.Value));
        return exists ? "شناسه URL (Slug) تکراری است." : null;
    }

    private static bool IsDescendant(int ancestorId, int nodeId, IReadOnlyDictionary<int, Category> lookup)
    {
        if (!lookup.TryGetValue(nodeId, out var node)) return false;
        var current = node.ParentId;
        var guard = 0;
        while (current.HasValue && guard++ < 16)
        {
            if (current.Value == ancestorId) return true;
            if (!lookup.TryGetValue(current.Value, out var parent)) break;
            current = parent.ParentId;
        }
        return false;
    }

    private async Task<List<Category>> GetSiblingsTrackedAsync(int? parentId, int? excludeId = null)
    {
        var query = db.Categories.Where(c => c.ParentId == parentId);
        if (excludeId.HasValue)
            query = query.Where(c => c.Id != excludeId.Value);
        return await query.OrderBy(c => c.SortOrder).ThenBy(c => c.Id).ToListAsync();
    }

    private static OperationResult MapSaveResult(CategorySaveResult result, string operationName)
    {
        var op = new OperationResult(operationName);
        if (result.Success)
            return op.ToSuccess(result.Message, result.RecordId!.Value);
        return op.ToFailed(result.Message);
    }

    private async Task<CategorySaveResult> SaveCoreAsync(CategoryAddEditModel model, bool isNew)
    {
        var parentError = await ValidateParentAsync(model.ParentId, isNew ? null : model.Id);
        if (parentError != null)
            return CategorySaveResult.Fail(parentError);

        var slugError = await ValidateSlugAsync(model.Slug, isNew ? null : model.Id);
        if (slugError != null)
            return CategorySaveResult.Fail(slugError);

        try
        {
            if (isNew)
            {
                var createSiblings = await GetSiblingsTrackedAsync(model.ParentId);
                var (sortOrder, conflict) = CategorySortHelper.Resolve(model, createSiblings);
                if (conflict != null)
                    return CategorySaveResult.Conflict(conflict);

                var depth = await ResolveDepthAsync(model.ParentId);
                var entity = new Category
                {
                    SortOrder = sortOrder,
                    Depth = depth,
                    CreatedAt = DateTime.UtcNow
                };
                ApplyModel(entity, model);

                db.Categories.Add(entity);
                await db.SaveChangesAsync();
                return CategorySaveResult.Ok("دسته‌بندی اضافه شد", entity.Id);
            }

            var entityExisting = await db.Categories.FirstOrDefaultAsync(x => x.Id == model.Id);
            if (entityExisting == null)
                return CategorySaveResult.Fail("دسته پیدا نشد");

            var parentChanged = entityExisting.ParentId != model.ParentId;
            var sortChanged = model.SortOrder is > 0 && model.SortOrder != entityExisting.SortOrder;
            var siblings = await GetSiblingsTrackedAsync(model.ParentId, model.Id);

            ApplyModel(entityExisting, model);

            if (parentChanged)
            {
                entityExisting.Depth = await ResolveDepthAsync(model.ParentId);
                await CascadeDepthToDescendantsAsync(entityExisting.Id, entityExisting.Depth);
            }

            if (parentChanged || sortChanged)
            {
                var (sortOrder, conflict) = CategorySortHelper.Resolve(model, siblings);
                if (conflict != null)
                    return CategorySaveResult.Conflict(conflict);
                entityExisting.SortOrder = sortOrder;
            }

            await db.SaveChangesAsync();
            return CategorySaveResult.Ok("دسته‌بندی ویرایش شد", entityExisting.Id);
        }
        catch (Exception ex)
        {
            return CategorySaveResult.Fail(ex.Message);
        }
    }

    public Task<CategorySaveResult> CreateWithResult(CategoryAddEditModel model)
        => SaveCoreAsync(model, isNew: true);

    public Task<CategorySaveResult> UpdateWithResult(CategoryAddEditModel model)
        => SaveCoreAsync(model, isNew: false);

    public async Task<OperationResult> Add(CategoryAddEditModel model)
        => MapSaveResult(await SaveCoreAsync(model, isNew: true), "Add Category");

    public async Task<OperationResult> Update(CategoryAddEditModel model)
        => MapSaveResult(await SaveCoreAsync(model, isNew: false), "Update Category");

    public async Task<OperationResult> Delete(int id)
    {
        var op = new OperationResult("Delete Category");
        try
        {
            var entity = await db.Categories
                .Include(c => c.Products)
                .Include(c => c.Children)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null) return op.ToFailed("دسته پیدا نشد");
            if (entity.Products.Count > 0) return op.ToFailed("دسته دارای محصول است و قابل حذف نیست");
            if (entity.Children.Count > 0) return op.ToFailed("ابتدا زیردسته‌های این دسته را حذف یا منتقل کنید.");
            db.Categories.Remove(entity);
            await db.SaveChangesAsync();
            return op.ToSuccess("دسته‌بندی حذف شد", id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<CategoryAddEditModel?> Get(int id)
    {
        var entity = await db.Categories.AsNoTracking()
            .Include(c => c.ImageFile)
            .Include(c => c.OgImage)
            .Include(c => c.Parent)
            .Include(c => c.Products)
            .Include(c => c.Children)
            .FirstOrDefaultAsync(x => x.Id == id);
        return entity == null ? null : ToViewModel(entity, entity.Children.Count, entity.Parent?.Name);
    }

    public async Task<List<CategoryListItem>> GetAll()
    {
        var rows = await db.Categories.AsNoTracking()
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.Slug,
                c.MetaTitle,
                c.MetaDescription,
                c.IsActive,
                c.ParentId,
                c.SortOrder,
                c.Depth,
                c.CreatedAt
            })
            .OrderBy(c => c.Depth)
            .ThenBy(c => c.ParentId)
            .ThenBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync();

        var nameById = rows.ToDictionary(r => r.Id, r => r.Name);

        var categories = rows.Select(r => new CategoryListItem
        {
            Id = r.Id,
            Name = r.Name,
            Description = r.Description,
            Slug = r.Slug,
            MetaTitle = r.MetaTitle,
            MetaDescription = r.MetaDescription,
            IsActive = r.IsActive,
            ParentId = r.ParentId,
            ParentName = r.ParentId is int pid && nameById.TryGetValue(pid, out var parentName) ? parentName : null,
            SortOrder = r.SortOrder,
            Depth = r.Depth,
            CreatedAt = r.CreatedAt,
            ProductCount = 0,
            ChildCount = 0
        }).ToList();

        var productCounts = await db.Products.AsNoTracking()
            .GroupBy(p => p.CategoryId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count);

        var childCounts = await db.Categories.AsNoTracking()
            .Where(c => c.ParentId != null)
            .GroupBy(c => c.ParentId!.Value)
            .Select(g => new { ParentId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ParentId, x => x.Count);

        foreach (var category in categories)
        {
            if (productCounts.TryGetValue(category.Id, out var productCount))
                category.ProductCount = productCount;
            if (childCounts.TryGetValue(category.Id, out var childCount))
                category.ChildCount = childCount;
        }

        return categories;
    }

    public async Task<List<CategoryTreeNode>> GetTree()
    {
        var all = await GetAll();
        var nodes = all.ToDictionary(
            c => c.Id,
            c => new CategoryTreeNode
            {
                Id = c.Id,
                Name = c.Name,
                ParentId = c.ParentId,
                SortOrder = c.SortOrder,
                Depth = c.Depth,
                IsActive = c.IsActive,
                ProductCount = c.ProductCount,
                Slug = c.Slug
            });

        var roots = new List<CategoryTreeNode>();
        foreach (var node in nodes.Values.OrderBy(n => n.SortOrder).ThenBy(n => n.Name))
        {
            if (node.ParentId is null)
                roots.Add(node);
            else if (nodes.TryGetValue(node.ParentId.Value, out var parent))
                parent.Children.Add(node);
        }

        foreach (var root in roots)
            SortTreeChildren(root);

        return roots.OrderBy(r => r.SortOrder).ThenBy(r => r.Name).ToList();
    }

    private static void SortTreeChildren(CategoryTreeNode node)
    {
        node.Children = node.Children.OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToList();
        foreach (var child in node.Children)
            SortTreeChildren(child);
    }

    public async Task<CategoryListComplex> Search(CategorySearchModel searchModel)
    {
        searchModel.PageIndex = Math.Max(0, searchModel.PageIndex);
        if (searchModel.PageSize <= 0) searchModel.PageSize = 20;

        var query = db.Categories.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchModel.Search))
        {
            var term = searchModel.Search.Trim();
            query = query.Where(c =>
                c.Name.Contains(term) ||
                (c.Description != null && c.Description.Contains(term)) ||
                (c.Slug != null && c.Slug.Contains(term)));
        }

        if (searchModel.IsActive.HasValue)
            query = query.Where(c => c.IsActive == searchModel.IsActive.Value);

        if (searchModel.ParentId.HasValue)
            query = query.Where(c => c.ParentId == searchModel.ParentId.Value);

        var result = new CategoryListComplex { SearchModel = searchModel };
        result.SearchModel.RecordCount = await query.CountAsync();

        var pageIds = await query
            .OrderBy(c => c.Depth)
            .ThenBy(c => c.ParentId)
            .ThenBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Skip(searchModel.PageIndex * searchModel.PageSize)
            .Take(searchModel.PageSize)
            .Select(c => c.Id)
            .ToListAsync();

        if (pageIds.Count == 0)
            return result;

        var categories = await db.Categories.AsNoTracking()
            .Include(c => c.ImageFile)
            .Include(c => c.OgImage)
            .Include(c => c.Products)
            .Include(c => c.Children)
            .Include(c => c.Parent)
            .Where(c => pageIds.Contains(c.Id))
            .ToListAsync();

        var byId = categories.ToDictionary(c => c.Id);
        result.Items = pageIds
            .Where(byId.ContainsKey)
            .Select(id => ToListItem(byId[id], byId[id].Children.Count, byId[id].Parent?.Name))
            .ToList();

        return result;
    }
}
