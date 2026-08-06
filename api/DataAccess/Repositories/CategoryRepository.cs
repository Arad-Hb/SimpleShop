using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Category;
using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

public class CategoryRepository(SimpleShopDbContext db) : ICategoryRepository
{
    private static CategoryAddEditModel ToViewModel(Category c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        Slug = c.Slug,
        MetaTitle = c.MetaTitle,
        MetaDescription = c.MetaDescription,
        ImageFileId = c.ImageFileId,
        IsActive = c.IsActive,
        ParentId = c.ParentId,
        SortOrder = c.SortOrder,
        Depth = c.Depth
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
        IsActive = c.IsActive,
        ParentId = c.ParentId,
        ParentName = parentName,
        SortOrder = c.SortOrder,
        Depth = c.Depth,
        ChildCount = childCount
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
                    Name = model.Name,
                    Description = model.Description,
                    Slug = model.Slug,
                    MetaTitle = model.MetaTitle,
                    MetaDescription = model.MetaDescription,
                    ImageFileId = model.ImageFileId,
                    IsActive = model.IsActive,
                    ParentId = model.ParentId,
                    SortOrder = sortOrder,
                    Depth = depth
                };

                db.Categories.Add(entity);
                await db.SaveChangesAsync();
                return CategorySaveResult.Ok("دسته‌بندی اضافه شد", entity.Id);
            }

            var entityExisting = await db.Categories.FirstOrDefaultAsync(x => x.Id == model.Id);
            if (entityExisting == null)
                return CategorySaveResult.Fail("دسته پیدا نشد");

            var parentChanged = entityExisting.ParentId != model.ParentId;
            var sortRequested = model.SortOrder is > 0;
            var siblings = await GetSiblingsTrackedAsync(model.ParentId, model.Id);

            entityExisting.Name = model.Name;
            entityExisting.Description = model.Description;
            entityExisting.Slug = model.Slug;
            entityExisting.MetaTitle = model.MetaTitle;
            entityExisting.MetaDescription = model.MetaDescription;
            entityExisting.ImageFileId = model.ImageFileId;
            entityExisting.IsActive = model.IsActive;
            entityExisting.ParentId = model.ParentId;

            if (parentChanged)
            {
                entityExisting.Depth = await ResolveDepthAsync(model.ParentId);
                await CascadeDepthToDescendantsAsync(entityExisting.Id, entityExisting.Depth);
            }

            if (parentChanged || sortRequested)
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
        var entity = await db.Categories.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return entity == null ? null : ToViewModel(entity);
    }

    public async Task<List<CategoryListItem>> GetAll()
    {
        var categories = await db.Categories.AsNoTracking()
            .Include(c => c.ImageFile)
            .Include(c => c.Products)
            .Include(c => c.Children)
            .Include(c => c.Parent)
            .ToListAsync();

        return categories
            .Select(c => ToListItem(c, c.Children.Count, c.Parent?.Name))
            .OrderBy(c => c.Depth)
            .ThenBy(c => c.ParentId)
            .ThenBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToList();
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
