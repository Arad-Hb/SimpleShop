using DataAccess.Repositories.Orders;
using DataAccess.Repositories.Products;
using DomainModel.Context;
using DomainModel.ViewModels.Report;
using Framework.Common.Constants;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Services.Reports;

public class ReportService(
    ApplicationDbContext context,
    IProductRepository productRepository,
    IOrderRepository orderRepository) : IReportService
{
    public async Task<DashboardReportModel> GetDashboardAsync()
    {
        var products = await productRepository.Query()
            .Include(x => x.Category)
            .ToListAsync();

        var orders = await orderRepository.Query()
            .Include(x => x.User)
            .Include(x => x.OrderItems)
            .ToListAsync();

        var customerCount = await (
            from user in context.Users
            join userRole in context.UserRoles on user.Id equals userRole.UserId
            join role in context.Roles on userRole.RoleId equals role.Id
            where role.Name == RoleNames.Customer
            select user.Id).CountAsync();

        return new DashboardReportModel
        {
            ProductCount = products.Count,
            CategoryCount = await context.Categories.CountAsync(),
            CustomerCount = customerCount,
            OrderCount = orders.Count,
            LowStockCount = products.Count(x => x.Stock <= x.MinimumStock),
            SalesTotal = orders
                .Where(x => x.Status != OrderStatusCodes.Cancelled)
                .Sum(x => x.TotalAmount),
            OrdersByStatus = OrderStatusCodes.All.Select(status => new StatusTotalItem
            {
                Status = status,
                StatusTitle = OrderStatusCodes.ToPersian(status),
                Count = orders.Count(x => x.Status == status),
                TotalAmount = orders.Where(x => x.Status == status).Sum(x => x.TotalAmount)
            }).ToList(),
            LowStockProducts = products
                .Where(x => x.Stock <= x.MinimumStock)
                .OrderBy(x => x.Stock)
                .Take(8)
                .Select(DataAccess.Repositories.Products.ProductMapper.ToListItem)
                .ToList(),
            RecentOrders = orders
                .OrderByDescending(x => x.OrderDate)
                .Take(8)
                .Select(OrderMapper.ToListItem)
                .ToList()
        };
    }
}
