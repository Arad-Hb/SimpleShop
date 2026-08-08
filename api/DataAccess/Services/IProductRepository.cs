using DomainModel.ViewModels.Product;
using Framework.Common;
using Framework.Services;

namespace DataAccess.Services;

public interface IProductRepository
    : IBaseRepositorySearchable<ProductAddEditModel, int, ProductListItem, ProductSearchModel, ProductListComplex>
{
    Task<ProductListItem?> GetListItem(int id);
    Task<OperationResult> AddProductImage(int productId, ProductImageAddModel model);
    Task<OperationResult> UpdateProductImage(int productId, int imageId, ProductImageUpdateModel model);
    Task<OperationResult> RemoveProductImage(int productId, int imageId);
}
