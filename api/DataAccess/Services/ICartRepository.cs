using DomainModel.ViewModels.Cart;
using Framework.Common;
using Framework.Services;

namespace DataAccess.Services;

public interface ICartRepository
    : IBaseRepositorySearchable<CartItemAddEditModel, int, CartItemListItem, CartSearchModel, CartListComplex>
{
    Task<OperationResult> Clear(int customerId);
}
