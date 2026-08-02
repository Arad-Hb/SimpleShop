using Microsoft.EntityFrameworkCore;
using SimpleShop.Data;
using SimpleShop.Models.DTOs;

namespace SimpleShop.Services;

public interface IReportService
{
    Task<ReportDto> GetSummaryAsync(int lowStockThreshold = 5);
}

public class ReportService : IReportService
{
    private readonly ShopDbContext _context;

    public ReportService(ShopDbContext context) => _context = context;

    public async Task<ReportDto> GetSummaryAsync(int lowStockThreshold = 5)
    {
        var totalOrders = await _context.Orders.CountAsync();
        var totalSales = await _context.Orders.SumAsync(o => o.TotalAmount);

        var lowStock = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.Stock <= lowStockThreshold)
            .OrderBy(p => p.Stock)
            .Select(p => new LowStockProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Stock = p.Stock,
                CategoryName = p.Category.Name
            })
            .ToListAsync();

        return new ReportDto
        {
            TotalOrders = totalOrders,
            TotalSales = totalSales,
            LowStockProducts = lowStock
        };
    }
}
