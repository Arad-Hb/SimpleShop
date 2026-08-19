using ProductEntity = DomainModel.Models.Product;

namespace DataAccess.Repositories.Products;

public interface IProductRepository
{
    IQueryable<ProductEntity> Query(bool tracking = false);
    Task<ProductEntity?> GetByIdAsync(int id, bool tracking = true);
    Task<ProductEntity?> GetBySlugAsync(string slug, bool tracking = false);
    Task AddAsync(ProductEntity entity);
    void Remove(ProductEntity entity);
    Task<bool> SlugExistsAsync(string slug, int? excludeId = null);
    Task<bool> HasOrderItemsAsync(int id);
    Task<int> SaveChangesAsync();
}
