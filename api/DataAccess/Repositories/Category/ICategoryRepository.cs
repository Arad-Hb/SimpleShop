using CategoryEntity = DomainModel.Models.Category;

namespace DataAccess.Repositories.Categories;

public interface ICategoryRepository
{
    IQueryable<CategoryEntity> Query(bool tracking = false);
    Task<CategoryEntity?> GetByIdAsync(int id, bool tracking = true);
    Task<CategoryEntity?> GetBySlugAsync(string slug, bool tracking = false);
    Task AddAsync(CategoryEntity entity);
    void Remove(CategoryEntity entity);
    Task<bool> SlugExistsAsync(string slug, int? excludeId = null);
    Task<bool> HasChildrenAsync(int id);
    Task<bool> HasProductsAsync(int id);
    Task<int> SaveChangesAsync();
}
