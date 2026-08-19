using DomainModel.Context;
using Microsoft.EntityFrameworkCore;
using ProductEntity = DomainModel.Models.Product;

namespace DataAccess.Repositories.Products;

public class ProductRepository(ApplicationDbContext context) : IProductRepository
{
    public IQueryable<ProductEntity> Query(bool tracking = false)
        => tracking ? context.Products : context.Products.AsNoTracking();

    public Task<ProductEntity?> GetByIdAsync(int id, bool tracking = true)
        => Query(tracking)
            .Include(x => x.Category)
            .ThenInclude(x => x.Parent)
            .FirstOrDefaultAsync(x => x.Id == id);

    public Task<ProductEntity?> GetBySlugAsync(string slug, bool tracking = false)
        => Query(tracking)
            .Include(x => x.Category)
            .ThenInclude(x => x.Parent)
            .FirstOrDefaultAsync(x => x.Slug == slug);

    public Task AddAsync(ProductEntity entity) => context.Products.AddAsync(entity).AsTask();

    public void Remove(ProductEntity entity) => context.Products.Remove(entity);

    public Task<bool> SlugExistsAsync(string slug, int? excludeId = null)
        => context.Products.AnyAsync(x => x.Slug == slug && (!excludeId.HasValue || x.Id != excludeId.Value));

    public Task<bool> HasOrderItemsAsync(int id)
        => context.OrderItems.AnyAsync(x => x.ProductId == id);

    public Task<int> SaveChangesAsync() => context.SaveChangesAsync();
}
