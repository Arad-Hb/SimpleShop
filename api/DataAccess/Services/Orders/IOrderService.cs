using DomainModel.ViewModels.Order;
using Framework.Common;

namespace DataAccess.Services.Orders;

public interface IOrderService
{
    Task<OrderListComplex> SearchAdminAsync(OrderSearchModel model);
    Task<OrderListComplex> SearchCustomerAsync(string userId, OrderSearchModel model);
    Task<OrderDetailsModel?> GetAdminDetailsAsync(int id);
    Task<OrderDetailsModel?> GetCustomerDetailsAsync(string userId, int id);
    Task<OperationResult> CheckoutAsync(string userId, OrderCreateModel model);
    Task<OperationResult> UpdateStatusAsync(int id, string status);
    Task<OperationResult> CancelByCustomerAsync(string userId, int id);
    Task<OperationResult> CancelByAdminAsync(int id);
}
