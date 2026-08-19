using DataAccess.Repositories.Orders;
using DataAccess.Services.Common;
using DomainModel.Context;
using DomainModel.Models;
using DomainModel.ViewModels.Order;
using Framework.Common;
using Framework.Common.Constants;
using Framework.Common.Helpers;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Services.Orders;

public class OrderService(
    ApplicationDbContext context,
    IOrderRepository repository,
    IPaginationService pagination) : IOrderService
{
    public Task<OrderListComplex> SearchAdminAsync(OrderSearchModel model)
        => SearchAsync(repository.Query().Include(x => x.User).Include(x => x.OrderItems), model);

    public Task<OrderListComplex> SearchCustomerAsync(string userId, OrderSearchModel model)
        => SearchAsync(
            repository.Query().Include(x => x.User).Include(x => x.OrderItems).Where(x => x.UserId == userId),
            model);

    public async Task<OrderDetailsModel?> GetAdminDetailsAsync(int id)
    {
        var order = await repository.GetByIdAsync(id, tracking: false);
        return order is null ? null : OrderMapper.ToDetails(order, OrderStatusCodes.AdminCanCancel(order.Status));
    }

    public async Task<OrderDetailsModel?> GetCustomerDetailsAsync(string userId, int id)
    {
        var order = await repository.GetByIdAsync(id, tracking: false);
        if (order is null || order.UserId != userId)
            return null;

        return OrderMapper.ToDetails(order, OrderStatusCodes.CustomerCanCancel(order.Status));
    }

    public async Task<OperationResult> CheckoutAsync(string userId, OrderCreateModel model)
    {
        var result = new OperationResult("ثبت سفارش");
        var mobile = MobileHelper.Normalize(model.ShippingMobile);
        if (mobile is null)
            return result.ToFailed("شماره موبایل گیرنده معتبر نیست.");

        var groupedItems = model.Items
            .GroupBy(x => x.ProductId)
            .Select(g => new CheckoutItemModel { ProductId = g.Key, Quantity = g.Sum(x => x.Quantity) })
            .ToList();

        if (groupedItems.Count == 0)
            return result.ToFailed("سبد خرید خالی است.");

        var strategy = context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                var order = new Order
                {
                    UserId = userId,
                    OrderDate = DateTime.Now,
                    Status = OrderStatusCodes.Pending,
                    ShippingFullName = model.ShippingFullName.Trim(),
                    ShippingMobile = mobile,
                    ShippingAddress = model.ShippingAddress.Trim(),
                    ShippingCity = string.IsNullOrWhiteSpace(model.ShippingCity) ? null : model.ShippingCity.Trim(),
                    ShippingPostalCode = string.IsNullOrWhiteSpace(model.ShippingPostalCode) ? null : model.ShippingPostalCode.Trim(),
                    CustomerNote = string.IsNullOrWhiteSpace(model.CustomerNote) ? null : model.CustomerNote.Trim()
                };

                decimal total = 0;
                foreach (var line in groupedItems)
                {
                    var product = await context.Products
                        .FirstOrDefaultAsync(x => x.Id == line.ProductId);

                    if (product is null || !product.IsActive)
                    {
                        await transaction.RollbackAsync();
                        return result.ToFailed("یکی از محصولات سبد خرید دیگر موجود نیست.");
                    }

                    if (product.Stock < line.Quantity)
                    {
                        await transaction.RollbackAsync();
                        return result.ToFailed($"موجودی «{product.Name}» کافی نیست. موجودی فعلی: {product.Stock}");
                    }

                    product.Stock -= line.Quantity;
                    var lineTotal = product.Price * line.Quantity;
                    total += lineTotal;
                    order.OrderItems.Add(new OrderItem
                    {
                        ProductId = product.Id,
                        ProductName = product.Name,
                        UnitPrice = product.Price,
                        Quantity = line.Quantity,
                        LineTotal = lineTotal
                    });
                }

                order.TotalAmount = total;
                await repository.AddAsync(order);
                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return result.ToSuccess("سفارش با موفقیت ثبت شد.", order.Id);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });
    }

    public async Task<OperationResult> UpdateStatusAsync(int id, string status)
    {
        var result = new OperationResult("تغییر وضعیت سفارش");
        if (!OrderStatusCodes.IsValid(status))
            return result.ToFailed("وضعیت سفارش معتبر نیست.");

        var order = await repository.GetByIdAsync(id);
        if (order is null)
            return result.ToFailed("سفارش پیدا نشد.");

        var next = OrderStatusCodes.Normalize(status);
        if (!OrderStatusCodes.CanTransition(order.Status, next))
            return result.ToFailed("این تغییر وضعیت مجاز نیست.");

        if (next == OrderStatusCodes.Cancelled)
            return await CancelCoreAsync(order, result, restoreStock: OrderStatusCodes.AdminCanCancel(order.Status));

        order.Status = next;
        await repository.SaveChangesAsync();
        return result.ToSuccess("وضعیت سفارش به‌روز شد.", order.Id);
    }

    public async Task<OperationResult> CancelByCustomerAsync(string userId, int id)
    {
        var result = new OperationResult("لغو سفارش");
        var order = await repository.GetByIdAsync(id);
        if (order is null || order.UserId != userId)
            return result.ToFailed("سفارش پیدا نشد.");

        if (!OrderStatusCodes.CustomerCanCancel(order.Status))
            return result.ToFailed("فقط سفارش‌های در انتظار قابل لغو هستند.");

        return await CancelCoreAsync(order, result, restoreStock: true);
    }

    public async Task<OperationResult> CancelByAdminAsync(int id)
    {
        var result = new OperationResult("لغو سفارش");
        var order = await repository.GetByIdAsync(id);
        if (order is null)
            return result.ToFailed("سفارش پیدا نشد.");

        if (!OrderStatusCodes.AdminCanCancel(order.Status))
            return result.ToFailed("این سفارش دیگر قابل لغو نیست.");

        return await CancelCoreAsync(order, result, restoreStock: true);
    }

    private async Task<OrderListComplex> SearchAsync(IQueryable<Order> query, OrderSearchModel model)
    {
        if (!string.IsNullOrWhiteSpace(model.Term))
        {
            var term = model.Term.Trim();
            query = query.Where(x =>
                x.Id.ToString() == term ||
                x.ShippingFullName.Contains(term) ||
                x.ShippingMobile.Contains(term) ||
                (x.User.PhoneNumber != null && x.User.PhoneNumber.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(model.Status))
        {
            var status = OrderStatusCodes.Normalize(model.Status);
            query = query.Where(x => x.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(model.UserId))
            query = query.Where(x => x.UserId == model.UserId);

        query = query.OrderByDescending(x => x.OrderDate);
        var rows = await pagination.PaginateAsync(query, model);
        return new OrderListComplex
        {
            Items = rows.Select(OrderMapper.ToListItem).ToList(),
            Page = model
        };
    }

    private async Task<OperationResult> CancelCoreAsync(Order order, OperationResult result, bool restoreStock)
    {
        if (order.Status == OrderStatusCodes.Cancelled)
            return result.ToSuccess("سفارش قبلاً لغو شده است.", order.Id);

        if (restoreStock)
        {
            foreach (var item in order.OrderItems)
            {
                if (item.ProductId is null)
                    continue;

                var product = await context.Products.FirstOrDefaultAsync(x => x.Id == item.ProductId.Value);
                if (product is not null)
                    product.Stock += item.Quantity;
            }
        }

        order.Status = OrderStatusCodes.Cancelled;
        await context.SaveChangesAsync();
        return result.ToSuccess("سفارش لغو شد و موجودی بازگردانده شد.", order.Id);
    }
}
