using DomainModel.ViewModels.Order;
using DomainModel.ViewModels.Report;
using Framework.Common;
using Framework.Services;

namespace DataAccess.Services;

public interface IOrderRepository
    : IBaseRepositorySearchable<OrderCreateModel, int, OrderListItem, OrderSearchModel, OrderListComplex>
{
    Task<OrderDetailsModel?> GetDetails(int id);
    Task<OperationResult> UpdateStatus(int id, string status);
    Task<OperationResult> CreateFromItems(OrderCreateModel model);
    Task<SalesReportPayload> GetSalesReportData();
}
