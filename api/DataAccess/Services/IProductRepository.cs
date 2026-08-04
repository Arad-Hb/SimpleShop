using DomainModel.ViewModels.Product;
using Framework.Services;

namespace DataAccess.Services;

public interface IProductRepository
    : IBaseRepositorySearchable<ProductAddEditModel, int, ProductListItem, ProductSearchModel, ProductListComplex>
{
    Task<ProductListItem?> GetListItem(int id);
}
