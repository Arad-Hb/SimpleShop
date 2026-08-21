using DomainModel.Context;
using DomainModel.ViewModels.Category;
using Microsoft.EntityFrameworkCore;
using CategoryEntity = DomainModel.Models.Category;

namespace DataAccess.Repositories.Categories;

public class CategoryRepository(ApplicationDbContext context) : ICategoryRepository
{
    public IQueryable<CategoryEntity> Query(bool tracking = false)
        => tracking ? context.Categories : context.Categories.AsNoTracking();

    public Task<CategoryEntity?> GetByIdAsync(int id, bool tracking = true)
        => Query(tracking)
            .Include(x => x.Parent)
            .Include(x => x.Children)
            .FirstOrDefaultAsync(x => x.Id == id);

    public Task<CategoryEntity?> GetBySlugAsync(string slug, bool tracking = false)
        => Query(tracking)
            .Include(x => x.Parent)
            .Include(x => x.Children)
            .FirstOrDefaultAsync(x => x.Slug == slug);

    public Task<List<CategoryEntity>> GetAllAsync(bool tracking = false)
        => Query(tracking)
            .Include(x => x.Parent)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ToListAsync();

    public Task<Dictionary<int, CategoryEntity>> GetLookupAsync()
        => context.Categories.AsNoTracking().ToDictionaryAsync(c => c.Id);

    public async Task<List<CategoryEntity>> GetSiblingsTrackedAsync(int? parentId, int? excludeId = null)
    {
        var query = context.Categories.Where(c => c.ParentId == parentId);
        if (excludeId.HasValue)
            query = query.Where(c => c.Id != excludeId.Value);
        return await query.OrderBy(c => c.SortOrder).ThenBy(c => c.Id).ToListAsync();
    }

    public Task<Dictionary<int, int>> GetDirectProductCountsAsync(bool activeProductsOnly = false)
    {
        var query = context.Products.AsNoTracking().AsQueryable();
        if (activeProductsOnly)
            query = query.Where(p => p.IsActive);

        return query
            .GroupBy(p => p.CategoryId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count);
    }

    public Task<Dictionary<int, int>> GetChildCountsAsync()
        => context.Categories.AsNoTracking()
            .Where(c => c.ParentId != null)
            .GroupBy(c => c.ParentId!.Value)
            .Select(g => new { ParentId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ParentId, x => x.Count);

    public async Task<List<int>> GetDescendantIdsAsync(int categoryId)
    {
        var lookup = await GetLookupAsync();
        var ids = new List<int>();
        var visited = new HashSet<int> { categoryId };
        Collect(categoryId);
        return ids;

        void Collect(int parentId)
        {
            foreach (var child in lookup.Values.Where(c => c.ParentId == parentId))
            {
                if (!visited.Add(child.Id))
                    continue;
                ids.Add(child.Id);
                Collect(child.Id);
            }
        }
    }

    public async Task<List<int>> GetSelfAndDescendantIdsAsync(int categoryId)
    {
        var ids = await GetDescendantIdsAsync(categoryId);
        ids.Insert(0, categoryId);
        return ids;
    }

    public Task AddAsync(CategoryEntity entity) => context.Categories.AddAsync(entity).AsTask();

    public void Remove(CategoryEntity entity) => context.Categories.Remove(entity);

    public Task<bool> SlugExistsAsync(string slug, int? excludeId = null)
        => context.Categories.AnyAsync(x => x.Slug == slug && (!excludeId.HasValue || x.Id != excludeId.Value));

    public Task<bool> HasChildrenAsync(int id)
        => context.Categories.AnyAsync(x => x.ParentId == id);

    public Task<bool> HasProductsAsync(int id)
        => context.Products.AnyAsync(x => x.CategoryId == id);

    public async Task<CategorySaveResult> InsertWithSortAsync(CategoryEntity entity, CategoryAddEditModel model)
    {
        var siblings = await GetSiblingsTrackedAsync(model.ParentId);
        var (sortOrder, conflict) = CategorySortHelper.Resolve(model, siblings);
        if (conflict != null)
            return CategorySaveResult.Conflict(conflict);

        entity.SortOrder = sortOrder;
        await AddAsync(entity);
        await SaveChangesAsync();
        return CategorySaveResult.Ok("دسته‌بندی با موفقیت اضافه شد.", entity.Id);
    }

    public async Task<(int SortOrder, CategorySaveResult? Conflict)> ResolveSortAsync(
        CategoryEntity entity,
        CategoryAddEditModel model,
        bool parentChanged)
    {
        // UPDATE: omitted SortOrder keeps the current slot. CREATE still appends on null.
        if (!parentChanged && model.SortOrder is null)
            return (entity.SortOrder, null);

        var sortChanged = model.SortOrder is > 0 && model.SortOrder != entity.SortOrder;
        var shouldAppend = model.SortOrder is <= 0;
        var shouldResolve = parentChanged || sortChanged || shouldAppend;
        if (!shouldResolve)
            return (entity.SortOrder, null);

        var siblings = await GetSiblingsTrackedAsync(model.ParentId, entity.Id);
        var (sortOrder, conflict) = CategorySortHelper.Resolve(
            model,
            siblings,
            parentChanged ? null : entity.SortOrder);
        if (conflict != null)
            return (entity.SortOrder, CategorySaveResult.Conflict(conflict));

        return (sortOrder, null);
    }

    public Task<int> SaveChangesAsync() => context.SaveChangesAsync();
}
