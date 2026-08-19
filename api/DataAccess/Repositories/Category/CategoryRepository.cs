using DomainModel.Context;
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
            .Include(x => x.Products)
            .FirstOrDefaultAsync(x => x.Slug == slug);

    public Task AddAsync(CategoryEntity entity) => context.Categories.AddAsync(entity).AsTask();

    public void Remove(CategoryEntity entity) => context.Categories.Remove(entity);

    public Task<bool> SlugExistsAsync(string slug, int? excludeId = null)
        => context.Categories.AnyAsync(x => x.Slug == slug && (!excludeId.HasValue || x.Id != excludeId.Value));

    public Task<bool> HasChildrenAsync(int id)
        => context.Categories.AnyAsync(x => x.ParentId == id);

    public Task<bool> HasProductsAsync(int id)
        => context.Products.AnyAsync(x => x.CategoryId == id);

    public Task<int> SaveChangesAsync() => context.SaveChangesAsync();
}
