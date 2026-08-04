using DomainModel.ViewModels.Category;
using Framework.Services;

namespace DataAccess.Services;

public interface ICategoryRepository
    : IBaseRepositorySearchable<CategoryAddEditModel, int, CategoryListItem, CategorySearchModel, CategoryListComplex>
{
    Task<List<CategoryListItem>> GetAll();
}
