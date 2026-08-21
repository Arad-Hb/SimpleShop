using DomainModel.ViewModels.Category;
using CategoryEntity = DomainModel.Models.Category;

namespace DataAccess.Repositories.Categories;

public interface ICategoryRepository
{
    IQueryable<CategoryEntity> Query(bool tracking = false);
    Task<CategoryEntity?> GetByIdAsync(int id, bool tracking = true);
    Task<CategoryEntity?> GetBySlugAsync(string slug, bool tracking = false);
    Task<List<CategoryEntity>> GetAllAsync(bool tracking = false);
    Task<Dictionary<int, CategoryEntity>> GetLookupAsync();
    Task<List<CategoryEntity>> GetSiblingsTrackedAsync(int? parentId, int? excludeId = null);
    Task<Dictionary<int, int>> GetDirectProductCountsAsync(bool activeProductsOnly = false);
    Task<Dictionary<int, int>> GetChildCountsAsync();
    Task<List<int>> GetDescendantIdsAsync(int categoryId);
    Task<List<int>> GetSelfAndDescendantIdsAsync(int categoryId);
    Task AddAsync(CategoryEntity entity);
    void Remove(CategoryEntity entity);
    Task<bool> SlugExistsAsync(string slug, int? excludeId = null);
    Task<bool> HasChildrenAsync(int id);
    Task<bool> HasProductsAsync(int id);
    Task<CategorySaveResult> InsertWithSortAsync(CategoryEntity entity, CategoryAddEditModel model);
    Task<(int SortOrder, CategorySaveResult? Conflict)> ResolveSortAsync(
        CategoryEntity entity,
        CategoryAddEditModel model,
        bool parentChanged);
    Task<int> SaveChangesAsync();
}
