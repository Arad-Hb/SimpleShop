using DomainModel.ViewModels.Customer;
using Framework.Common;

namespace DataAccess.Services.Customers;

public interface ICustomerService
{
    Task<CustomerListComplex> SearchAsync(CustomerSearchModel model);
    Task<CustomerDetailsModel?> GetAsync(string id);
    Task<OperationResult> AddAsync(CustomerAddEditModel model);
    Task<OperationResult> UpdateAsync(string id, CustomerAddEditModel model);
    Task<OperationResult> SetActiveAsync(string id, bool isActive);
}
