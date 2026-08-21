using DataAccess.Repositories.Categories;
using DataAccess.Services.Common;
using DomainModel.Models;
using DomainModel.ViewModels.Category;
using Framework.Common;
using Microsoft.EntityFrameworkCore;
using CategoryEntity = DomainModel.Models.Category;

namespace DataAccess.Services.Categories;

public class CategoryService(
    ICategoryRepository repository,
    IPaginationService pagination) : ICategoryService
{
    public async Task<List<CategoryMenuItem>> GetMenuAsync()
    {
        var all = await repository.GetAllAsync();
        var lookup = all.ToDictionary(c => c.Id);
        var productCounts = await repository.GetDirectProductCountsAsync(activeProductsOnly: true);
        var inclusive = ComputeInclusiveProductCounts(all, productCounts, includeNode: c => c.IsActive);

        var nodes = new Dictionary<int, CategoryMenuItem>();
        foreach (var entity in all.Where(c => c.IsActive))
        {
            var depth = CategoryHierarchyRules.GetDepth(entity.ParentId, lookup);
            var direct = productCounts.GetValueOrDefault(entity.Id);
            nodes[entity.Id] = CategoryMapper.ToMenuItem(
                entity,
                depth,
                direct,
                inclusive.GetValueOrDefault(entity.Id, direct));
        }

        var roots = new List<CategoryMenuItem>();
        foreach (var entity in all.Where(c => c.IsActive).OrderBy(c => c.SortOrder).ThenBy(c => c.Name))
        {
            var node = nodes[entity.Id];
            if (entity.ParentId is null)
                roots.Add(node);
            else if (nodes.TryGetValue(entity.ParentId.Value, out var parent))
                parent.Children.Add(node);
        }

        foreach (var root in roots)
            SortMenuChildren(root);

        return roots;
    }

    public async Task<List<CategoryTreeNode>> GetTreeAsync()
    {
        var all = await repository.GetAllAsync();
        var lookup = all.ToDictionary(c => c.Id);
        var productCounts = await repository.GetDirectProductCountsAsync();

        var nodes = all.ToDictionary(
            c => c.Id,
            c => new CategoryTreeNode
            {
                Id = c.Id,
                Name = c.Name,
                ParentId = c.ParentId,
                SortOrder = c.SortOrder,
                Depth = CategoryHierarchyRules.GetDepth(c.ParentId, lookup),
                IsActive = c.IsActive,
                ProductCount = productCounts.GetValueOrDefault(c.Id),
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

    public async Task<CategoryDetailsModel?> GetDetailsAsync(int id, bool publicOnly = false)
    {
        var entity = await repository.GetByIdAsync(id, tracking: false);
        if (entity is null)
            return null;
        if (publicOnly && !entity.IsActive)
            return null;
        return await MapDetailsAsync(entity, publicOnly);
    }

    public async Task<CategoryDetailsModel?> GetBySlugAsync(string slug)
    {
        var entity = await repository.GetBySlugAsync(slug);
        if (entity is null || !entity.IsActive)
            return null;
        return await MapDetailsAsync(entity, publicOnly: true);
    }

    public async Task<CategoryListComplex> SearchAsync(CategorySearchModel model)
    {
        var query = repository.Query()
            .Include(x => x.Parent)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(model.Term))
        {
            var term = model.Term.Trim();
            query = query.Where(x => x.Name.Contains(term) || (x.Slug != null && x.Slug.Contains(term)));
        }

        if (model.ParentId.HasValue)
            query = query.Where(x => x.ParentId == model.ParentId);

        if (model.IsActive.HasValue)
            query = query.Where(x => x.IsActive == model.IsActive);

        query = query.OrderBy(x => x.ParentId.HasValue).ThenBy(x => x.SortOrder).ThenBy(x => x.Name);
        var rows = await pagination.PaginateAsync(query, model);

        var lookup = await repository.GetLookupAsync();
        var productCounts = await repository.GetDirectProductCountsAsync();
        var childCounts = await repository.GetChildCountsAsync();

        return new CategoryListComplex
        {
            Items = rows.Select(entity => CategoryMapper.ToListItem(
                entity,
                CategoryHierarchyRules.GetDepth(entity.ParentId, lookup),
                productCounts.GetValueOrDefault(entity.Id),
                childCounts.GetValueOrDefault(entity.Id))).ToList(),
            Page = model
        };
    }

    public async Task<CategorySaveResult> AddAsync(CategoryAddEditModel model)
    {
        var parentError = await ValidateHierarchyAsync(model.ParentId, currentId: null);
        if (parentError is not null)
            return CategorySaveResult.Fail(parentError);

        var slug = await EnsureUniqueSlugAsync(model.ResolvedSlug, null);
        var entity = CategoryMapper.ToEntity(model);
        entity.Slug = slug;
        return await repository.InsertWithSortAsync(entity, model);
    }

    public async Task<CategorySaveResult> UpdateAsync(int id, CategoryAddEditModel model)
    {
        var entity = await repository.GetByIdAsync(id);
        if (entity is null)
            return CategorySaveResult.Fail("دسته‌بندی پیدا نشد.");

        if (model.ParentId == id)
            return CategorySaveResult.Fail("دسته‌بندی نمی‌تواند والد خودش باشد.");

        var parentError = await ValidateHierarchyAsync(model.ParentId, id);
        if (parentError is not null)
            return CategorySaveResult.Fail(parentError);

        var parentChanged = entity.ParentId != model.ParentId;
        var (sortOrder, sortConflict) = await repository.ResolveSortAsync(entity, model, parentChanged);
        if (sortConflict is not null)
            return sortConflict;

        CategoryMapper.MapForUpdate(model, entity);
        entity.SortOrder = sortOrder;
        entity.Slug = await EnsureUniqueSlugAsync(model.ResolvedSlug, id);
        await repository.SaveChangesAsync();
        return CategorySaveResult.Ok("دسته‌بندی با موفقیت ویرایش شد.", entity.Id);
    }

    public async Task<OperationResult> DeleteAsync(int id)
    {
        var result = new OperationResult("حذف دسته‌بندی");
        var entity = await repository.GetByIdAsync(id);
        if (entity is null)
            return result.ToFailed("دسته‌بندی پیدا نشد.");

        if (await repository.HasChildrenAsync(id))
            return result.ToFailed("ابتدا زیرمجموعه‌های این دسته را حذف کنید.");

        if (await repository.HasProductsAsync(id))
            return result.ToFailed("این دسته دارای محصول است و قابل حذف نیست.");

        repository.Remove(entity);
        await repository.SaveChangesAsync();
        return result.ToSuccess("دسته‌بندی حذف شد.", id);
    }

    public async Task<OperationResult> UpdateImageAsync(int id, string imagePath, string? thumbnailPath)
    {
        var result = new OperationResult("تصویر دسته‌بندی");
        var entity = await repository.GetByIdAsync(id);
        if (entity is null)
            return result.ToFailed("دسته‌بندی پیدا نشد.");

        entity.ImagePath = imagePath;
        entity.ThumbnailPath = thumbnailPath;
        entity.UpdateDate = DateTime.Now;
        await repository.SaveChangesAsync();
        return result.ToSuccess("تصویر دسته‌بندی ذخیره شد.", id);
    }

    public async Task<(string? ImagePath, string? ThumbnailPath)?> GetImagePathsAsync(int id)
    {
        var entity = await repository.GetByIdAsync(id, tracking: false);
        return entity is null ? null : (entity.ImagePath, entity.ThumbnailPath);
    }

    private async Task<CategoryDetailsModel> MapDetailsAsync(CategoryEntity entity, bool publicOnly)
    {
        var lookup = await repository.GetLookupAsync();
        var productCounts = await repository.GetDirectProductCountsAsync(activeProductsOnly: publicOnly);
        var childCounts = await repository.GetChildCountsAsync();
        var inclusive = ComputeInclusiveProductCounts(
            lookup.Values.ToList(),
            productCounts,
            includeNode: publicOnly ? c => c.IsActive : null);
        var depth = CategoryHierarchyRules.GetDepth(entity.ParentId, lookup);
        var direct = productCounts.GetValueOrDefault(entity.Id);

        var childrenQuery = entity.Children.AsEnumerable();
        if (publicOnly)
            childrenQuery = childrenQuery.Where(c => c.IsActive);

        var children = childrenQuery
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => CategoryMapper.ToListItem(
                c,
                CategoryHierarchyRules.GetDepth(c.ParentId, lookup),
                productCounts.GetValueOrDefault(c.Id),
                childCounts.GetValueOrDefault(c.Id)))
            .ToList();

        return CategoryMapper.ToDetails(
            entity,
            depth,
            direct,
            inclusive.GetValueOrDefault(entity.Id, direct),
            CategoryHierarchyRules.CanHaveChildren(depth) && direct == 0,
            BuildBreadcrumb(entity.Id, lookup, productCounts, childCounts),
            children);
    }

    private static List<CategoryListItem> BuildBreadcrumb(
        int categoryId,
        IReadOnlyDictionary<int, CategoryEntity> lookup,
        IReadOnlyDictionary<int, int> productCounts,
        IReadOnlyDictionary<int, int> childCounts)
    {
        var chain = new List<CategoryEntity>();
        var currentId = (int?)categoryId;
        var guard = 0;
        while (currentId.HasValue && guard++ < 16 && lookup.TryGetValue(currentId.Value, out var current))
        {
            chain.Add(current);
            currentId = current.ParentId;
        }

        chain.Reverse();
        return chain.Select(c => CategoryMapper.ToListItem(
            c,
            CategoryHierarchyRules.GetDepth(c.ParentId, lookup),
            productCounts.GetValueOrDefault(c.Id),
            childCounts.GetValueOrDefault(c.Id))).ToList();
    }

    private async Task<string?> ValidateHierarchyAsync(int? parentId, int? currentId)
    {
        if (parentId is null)
            return null;

        var lookup = await repository.GetLookupAsync();
        if (!lookup.TryGetValue(parentId.Value, out var parent))
            return "دسته‌بندی والد پیدا نشد.";

        if (currentId.HasValue && parentId == currentId)
            return "دسته‌بندی نمی‌تواند والد خودش باشد.";

        var parentDepth = CategoryHierarchyRules.GetDepth(parent.ParentId, lookup);
        if (!CategoryHierarchyRules.IsValidParentDepth(parentDepth))
            return $"حداکثر {CategoryHierarchyRules.MaxDepth} سطح زیرمجموعه مجاز است — این سطح دیگر نمی‌تواند زیردسته داشته باشد.";

        if (currentId.HasValue && CategoryHierarchyRules.IsDescendant(currentId.Value, parentId.Value, lookup))
            return "انتخاب این والد باعث حلقه در درخت دسته‌بندی می‌شود.";

        if (currentId.HasValue)
        {
            var newDepth = CategoryHierarchyRules.ComputeChildDepth(parentId, parentDepth);
            var subtreeHeight = CategoryHierarchyRules.GetSubtreeHeight(currentId.Value, lookup);
            if (newDepth + subtreeHeight > CategoryHierarchyRules.MaxDepth)
                return "جابه‌جایی این دسته عمق درخت را از حد مجاز بیشتر می‌کند.";
        }

        if (await repository.HasProductsAsync(parentId.Value))
            return "دسته‌ای که محصول دارد نمی‌تواند زیردسته بگیرد. ابتدا محصولات را به یک دسته برگ منتقل کنید.";

        return null;
    }

    private async Task<string> EnsureUniqueSlugAsync(string slug, int? excludeId)
    {
        var baseSlug = string.IsNullOrWhiteSpace(slug) ? "category" : slug;
        var candidate = baseSlug;
        var index = 2;
        while (await repository.SlugExistsAsync(candidate, excludeId))
        {
            candidate = $"{baseSlug}-{index}";
            index++;
        }

        return candidate;
    }

    private static Dictionary<int, int> ComputeInclusiveProductCounts(
        List<CategoryEntity> all,
        IReadOnlyDictionary<int, int> directCounts,
        Func<CategoryEntity, bool>? includeNode = null)
    {
        var byId = all.ToDictionary(c => c.Id);
        var children = all
            .Where(c => c.ParentId.HasValue && (includeNode is null || includeNode(c)))
            .GroupBy(c => c.ParentId!.Value)
            .ToDictionary(g => g.Key, g => g.Select(c => c.Id).ToList());

        var memo = new Dictionary<int, int>();
        int Walk(int id, HashSet<int> stack)
        {
            if (memo.TryGetValue(id, out var cached))
                return cached;
            if (!stack.Add(id))
                return 0;

            var included = includeNode is null || (byId.TryGetValue(id, out var node) && includeNode(node));
            var total = included ? directCounts.GetValueOrDefault(id) : 0;
            if (included && children.TryGetValue(id, out var childIds))
            {
                foreach (var childId in childIds)
                    total += Walk(childId, stack);
            }

            stack.Remove(id);
            memo[id] = total;
            return total;
        }

        foreach (var category in all)
            Walk(category.Id, []);

        return memo;
    }

    private static void SortMenuChildren(CategoryMenuItem node)
    {
        node.Children = node.Children.OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToList();
        foreach (var child in node.Children)
            SortMenuChildren(child);
    }

    private static void SortTreeChildren(CategoryTreeNode node)
    {
        node.Children = node.Children.OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToList();
        foreach (var child in node.Children)
            SortTreeChildren(child);
    }
}
