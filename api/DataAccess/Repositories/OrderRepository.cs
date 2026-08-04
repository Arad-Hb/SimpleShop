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

    private static (string FirstName, string LastName) SplitName(string? fullName)
    {
        var name = (fullName ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(name)) return ("مشتری", "");
        var parts = name.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        return parts.Length == 1 ? (parts[0], "") : (parts[0], parts[1]);
    }

    public Task<OperationResult> Add(OrderCreateModel model) => CreateFromCart(model);

    public async Task<OperationResult> Update(OrderCreateModel model)
    {
        var op = new OperationResult("Update Order");
        return await Task.FromResult(op.ToFailed("برای تغییر وضعیت از UpdateStatus استفاده کنید"));
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
            CustomerId = order.CustomerId,
            ShippingAddress = order.ShippingAddress
        };
    }

    public async Task<OrderDetailsModel?> GetDetails(int id)
    {
        var order = await db.Orders.AsNoTracking()
            .Include(o => o.Customer).ThenInclude(c => c.User)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return null;

        return new OrderDetailsModel
        {
            Id = order.Id,
            CustomerId = order.CustomerId,
            CustomerName = order.Customer.User.FullName,
            OrderDate = order.OrderDate,
            Status = order.Status,
            TotalAmount = order.TotalAmount,
            ShippingAddress = order.ShippingAddress,
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
            .Include(o => o.Customer).ThenInclude(c => c.User)
            .Include(o => o.OrderItems)
            .AsQueryable();

        if (searchModel.CustomerId is > 0)
            query = query.Where(o => o.CustomerId == searchModel.CustomerId);

        if (!string.IsNullOrWhiteSpace(searchModel.Status))
            query = query.Where(o => o.Status == searchModel.Status);

        var result = new OrderListComplex { SearchModel = searchModel };
        result.SearchModel.RecordCount = await query.CountAsync();
        result.Items = await query
            .OrderByDescending(o => o.OrderDate)
            .Skip(searchModel.PageIndex * searchModel.PageSize)
            .Take(searchModel.PageSize)
            .Select(o => new OrderListItem
            {
                Id = o.Id,
                CustomerId = o.CustomerId,
                CustomerName = o.Customer.User.FullName,
                OrderDate = o.OrderDate,
                Status = o.Status,
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

        var customers = await db.Customers.AsNoTracking()
            .Include(c => c.User)
            .OrderBy(c => c.Id)
            .ToListAsync();

        var payload = new SalesReportPayload();

        foreach (var customer in customers)
        {
            var (first, last) = SplitName(customer.User?.FullName);
            payload.Customers.Add(new SalesReportCustomerDto
            {
                Id = customer.Id,
                FirstName = first,
                LastName = last,
                FullName = customer.User?.FullName ?? $"{first} {last}".Trim(),
                Mobile = customer.Phone ?? string.Empty,
                Email = customer.User?.Email ?? string.Empty
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
                CustomerId = order.CustomerId,
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
            order.Status = status;
            await db.SaveChangesAsync();
            return op.ToSuccess("وضعیت سفارش به‌روزرسانی شد", id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> CreateFromCart(OrderCreateModel model)
    {
        var op = new OperationResult("Create Order From Cart");
        try
        {
            var cartItems = await db.CartItems
                .Include(ci => ci.Product)
                .Where(ci => ci.CustomerId == model.CustomerId)
                .ToListAsync();

            if (cartItems.Count == 0)
                return op.ToFailed("سبد خرید خالی است");

            foreach (var item in cartItems)
            {
                if (item.Quantity > item.Product.Stock)
                    return op.ToFailed($"موجودی «{item.Product.Name}» کافی نیست");
            }

            var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == model.CustomerId);
            if (customer == null) return op.ToFailed("مشتری پیدا نشد");

            await using var transaction = await db.Database.BeginTransactionAsync();
            try
            {
                var order = new Order
                {
                    CustomerId = model.CustomerId,
                    Status = "Pending",
                    ShippingAddress = model.ShippingAddress ?? customer.Address,
                    OrderItems = cartItems.Select(ci => new OrderItem
                    {
                        ProductId = ci.ProductId,
                        Quantity = ci.Quantity,
                        UnitPrice = ci.Product.Price
                    }).ToList()
                };
                order.TotalAmount = order.OrderItems.Sum(oi => oi.UnitPrice * oi.Quantity);

                foreach (var item in cartItems)
                    item.Product.Stock -= item.Quantity;

                db.Orders.Add(order);
                db.CartItems.RemoveRange(cartItems);
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
