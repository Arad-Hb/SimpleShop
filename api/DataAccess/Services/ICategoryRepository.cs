using DomainModel.ViewModels.Category;
using Framework.Services;

namespace DataAccess.Services;

public interface ICategoryRepository
    : IBaseRepositorySearchable<CategoryAddEditModel, int, CategoryListItem, CategorySearchModel, CategoryListComplex>
{
    Task<List<CategoryListItem>> GetAll();
    Task<List<CategoryTreeNode>> GetTree();

    /// <summary>Full save result including sort-order conflict payload for admin API (409).</summary>
    Task<CategorySaveResult> CreateWithResult(CategoryAddEditModel model);
    Task<CategorySaveResult> UpdateWithResult(CategoryAddEditModel model);
}
