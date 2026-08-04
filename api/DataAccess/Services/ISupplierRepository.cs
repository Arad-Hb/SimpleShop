using DomainModel.ViewModels.Supplier;
using Framework.Services;

namespace DataAccess.Services;

public interface ISupplierRepository
    : IBaseRepositorySearchable<SupplierAddEditModel, int, SupplierListItem, SupplierSearchModel, SupplierListComplex>
{
}
