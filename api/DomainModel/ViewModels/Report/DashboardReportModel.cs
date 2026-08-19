using DomainModel.ViewModels.Order;
using DomainModel.ViewModels.Product;

namespace DomainModel.ViewModels.Report;

public class DashboardReportModel
{
    public int ProductCount { get; set; }
    public int CategoryCount { get; set; }
    public int CustomerCount { get; set; }
    public int OrderCount { get; set; }
    public int LowStockCount { get; set; }
    public decimal SalesTotal { get; set; }
    public List<StatusTotalItem> OrdersByStatus { get; set; } = [];
    public List<ProductListItem> LowStockProducts { get; set; } = [];
    public List<OrderListItem> RecentOrders { get; set; } = [];
}
