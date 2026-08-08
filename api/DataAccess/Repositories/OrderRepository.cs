using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Order;
using DomainModel.ViewModels.Report;
using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

public class OrderRepository(SimpleShopDbContext db) : IOrderRepository
{
    private static string NormalizeStatus(string status)
        => string.IsNullOrWhiteSpace(status) ? "pending" : status.Trim().ToLowerInvariant();

    private static string DerivePaymentStatus(string normalizedStatus) => normalizedStatus switch
    {
        "cancelled" => "refunded",
        "pending" => "unpaid",
        _ => "paid"
    };

    public Task<OperationResult> Add(OrderCreateModel model) => CreateFromItems(model);

    public async Task<OperationResult> Update(OrderCreateModel model)
    {
        var op = new OperationResult("Update Order");
        try
        {
            if (model.Id <= 0)
                return op.ToFailed("شناسه سفارش نامعتبر است");

            var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == model.Id);
            if (order == null)
                return op.ToFailed("سفارش پیدا نشد");

            if (!string.IsNullOrWhiteSpace(model.ShippingAddress))
                order.ShippingAddress = model.ShippingAddress.Trim();

            if (!string.IsNullOrWhiteSpace(model.PaymentStatus))
                order.PaymentStatus = model.PaymentStatus.Trim().ToLowerInvariant();

            if (!string.IsNullOrWhiteSpace(model.Status))
                order.Status = NormalizeStatus(model.Status);

            await db.SaveChangesAsync();
            return op.ToSuccess("سفارش به‌روزرسانی شد", order.Id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> Delete(int id)
    {
        var op = new OperationResult("Delete Order");
        try
        {
            var order = await db.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return op.ToFailed("سفارش پیدا نشد");
            db.OrderItems.RemoveRange(order.OrderItems);
            db.Orders.Remove(order);
            await db.SaveChangesAsync();
            return op.ToSuccess("سفارش حذف شد", id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OrderCreateModel?> Get(int id)
    {
        var order = await db.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return null;
        return new OrderCreateModel
        {
            Id = order.Id,
            UserId = order.UserId,
            Status = NormalizeStatus(order.Status),
            ShippingAddress = order.ShippingAddress,
            PaymentStatus = order.PaymentStatus
        };
    }

    public async Task<OrderDetailsModel?> GetDetails(int id)
    {
        var order = await db.Orders.AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return null;

        return new OrderDetailsModel
        {
            Id = order.Id,
            UserId = order.UserId,
            CustomerName = order.User.DisplayName,
            OrderDate = order.OrderDate,
            Status = NormalizeStatus(order.Status),
            TotalAmount = order.TotalAmount,
            ShippingAddress = order.ShippingAddress,
            PaymentStatus = NormalizeStatus(order.PaymentStatus),
            Items = order.OrderItems.Select(oi => new OrderItemLine
            {
                ProductId = oi.ProductId,
                ProductName = oi.Product.Name,
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPrice
            }).ToList()
        };
    }

    public async Task<OrderListComplex> Search(OrderSearchModel searchModel)
    {
        if (searchModel.PageSize <= 0) searchModel.PageSize = 20;
        searchModel.PageIndex = Math.Max(0, searchModel.PageIndex);

        var query = db.Orders.AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.OrderItems)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchModel.UserId))
            query = query.Where(o => o.UserId == searchModel.UserId);

        if (!string.IsNullOrWhiteSpace(searchModel.Status))
        {
            var statusFilter = NormalizeStatus(searchModel.Status);
            query = query.Where(o => o.Status.ToLower() == statusFilter);
        }

        var result = new OrderListComplex { SearchModel = searchModel };
        result.SearchModel.RecordCount = await query.CountAsync();
        result.Items = await query
            .OrderByDescending(o => o.OrderDate)
            .Skip(searchModel.PageIndex * searchModel.PageSize)
            .Take(searchModel.PageSize)
            .Select(o => new OrderListItem
            {
                Id = o.Id,
                UserId = o.UserId,
                CustomerName = o.User.DisplayName,
                OrderDate = o.OrderDate,
                Status = o.Status.ToLower(),
                TotalAmount = o.TotalAmount,
                ItemCount = o.OrderItems.Count
            })
            .ToListAsync();
        return result;
    }

    public async Task<SalesReportPayload> GetSalesReportData()
    {
        var orders = await db.Orders.AsNoTracking()
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

        var users = await db.Users.AsNoTracking()
            .OrderBy(u => u.RegisterDate)
            .ToListAsync();

        var payload = new SalesReportPayload();

        foreach (var user in users)
        {
            payload.Customers.Add(new SalesReportCustomerDto
            {
                Id = user.Id,
                FirstName = user.FirstName ?? string.Empty,
                LastName = user.LastName ?? string.Empty,
                FullName = user.DisplayName,
                Mobile = user.PhoneNumber ?? string.Empty,
                Email = user.Email ?? string.Empty
            });
        }

        var itemId = 1;
        foreach (var order in orders)
        {
            var status = NormalizeStatus(order.Status);
            payload.Orders.Add(new SalesReportOrderDto
            {
                Id = order.Id,
                OrderNumber = $"ORD-{order.Id:D6}",
                CustomerId = order.UserId,
                Status = status,
                PaymentStatus = DerivePaymentStatus(status),
                Total = order.TotalAmount,
                CreatedAt = order.OrderDate
            });

            foreach (var item in order.OrderItems)
            {
                payload.OrderItems.Add(new SalesReportOrderItemDto
                {
                    Id = itemId++,
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    ProductName = item.Product?.Name ?? $"محصول #{item.ProductId}",
                    CategoryId = item.Product?.CategoryId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    Total = item.UnitPrice * item.Quantity
                });
            }
        }

        return payload;
    }

    public async Task<OperationResult> UpdateStatus(int id, string status)
    {
        var op = new OperationResult("Update Order Status");
        try
        {
            var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return op.ToFailed("سفارش پیدا نشد");
            order.Status = NormalizeStatus(status);
            await db.SaveChangesAsync();
            return op.ToSuccess("وضعیت سفارش به‌روزرسانی شد", id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    private static readonly HashSet<string> ValidPaymentStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "unpaid", "paid", "refunded"
    };

    public async Task<OperationResult> UpdatePaymentStatus(int id, string paymentStatus)
    {
        var op = new OperationResult("Update Order Payment Status");
        try
        {
            var normalized = NormalizeStatus(paymentStatus);
            if (!ValidPaymentStatuses.Contains(normalized))
                return op.ToFailed("وضعیت پرداخت نامعتبر است");

            var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return op.ToFailed("سفارش پیدا نشد");

            order.PaymentStatus = normalized;
            await db.SaveChangesAsync();
            return op.ToSuccess("وضعیت پرداخت به‌روزرسانی شد", id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> CreateFromItems(OrderCreateModel model)
    {
        var op = new OperationResult("Create Order");
        try
        {
            if (model.Items.Count == 0)
                return op.ToFailed("سبد خرید خالی است");

            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == model.UserId);
            if (user == null) return op.ToFailed("کاربر پیدا نشد");

            var productIds = model.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await db.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();

            foreach (var line in model.Items)
            {
                var product = products.FirstOrDefault(p => p.Id == line.ProductId);
                if (product == null) return op.ToFailed($"محصول #{line.ProductId} پیدا نشد");
                if (line.Quantity <= 0) return op.ToFailed("تعداد نامعتبر است");
                if (line.Quantity > product.Stock)
                    return op.ToFailed($"موجودی «{product.Name}» کافی نیست");
            }

            await using var transaction = await db.Database.BeginTransactionAsync();
            try
            {
                var order = new Order
                {
                    UserId = model.UserId,
                    Status = "pending",
                    PaymentStatus = string.IsNullOrWhiteSpace(model.PaymentStatus)
                        ? "unpaid"
                        : model.PaymentStatus.Trim().ToLowerInvariant(),
                    ShippingAddress = model.ShippingAddress ?? user.Address,
                    OrderItems = model.Items.Select(line =>
                    {
                        var product = products.First(p => p.Id == line.ProductId);
                        return new OrderItem
                        {
                            ProductId = line.ProductId,
                            Quantity = line.Quantity,
                            UnitPrice = product.Price
                        };
                    }).ToList()
                };
                order.TotalAmount = order.OrderItems.Sum(oi => oi.UnitPrice * oi.Quantity);

                foreach (var line in model.Items)
                {
                    var product = products.First(p => p.Id == line.ProductId);
                    product.Stock -= line.Quantity;
                }

                db.Orders.Add(order);
                await db.SaveChangesAsync();
                await transaction.CommitAsync();
                return op.ToSuccess("سفارش ثبت شد", order.Id);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return op.ToFailed(ex.Message);
            }
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }
}
