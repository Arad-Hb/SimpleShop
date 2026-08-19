using DomainModel.Models;
using DomainModel.ViewModels.Order;
using Framework.Common.Constants;
using Framework.Common.Extensions;

namespace DataAccess.Repositories.Orders;

public static class OrderMapper
{
    public static OrderListItem ToListItem(Order entity)
        => new()
        {
            Id = entity.Id,
            UserId = entity.UserId,
            CustomerName = entity.User?.DisplayName ?? entity.ShippingFullName,
            CustomerMobile = entity.User?.PhoneNumber ?? entity.ShippingMobile,
            OrderDate = entity.OrderDate,
            OrderDatePersian = entity.OrderDate.ToPersianDateTime(),
            Status = entity.Status,
            StatusTitle = OrderStatusCodes.ToPersian(entity.Status),
            TotalAmount = entity.TotalAmount,
            ItemCount = entity.OrderItems?.Sum(x => x.Quantity) ?? 0
        };

    public static OrderDetailsModel ToDetails(Order entity, bool canCancel)
        => new()
        {
            Id = entity.Id,
            UserId = entity.UserId,
            CustomerName = entity.User?.DisplayName ?? entity.ShippingFullName,
            CustomerMobile = entity.User?.PhoneNumber ?? entity.ShippingMobile,
            OrderDate = entity.OrderDate,
            OrderDatePersian = entity.OrderDate.ToPersianDateTime(),
            Status = entity.Status,
            StatusTitle = OrderStatusCodes.ToPersian(entity.Status),
            TotalAmount = entity.TotalAmount,
            ShippingFullName = entity.ShippingFullName,
            ShippingMobile = entity.ShippingMobile,
            ShippingAddress = entity.ShippingAddress,
            ShippingCity = entity.ShippingCity,
            ShippingPostalCode = entity.ShippingPostalCode,
            CustomerNote = entity.CustomerNote,
            CanCancel = canCancel,
            Items = entity.OrderItems
                .Select(x => new OrderItemDetailsModel
                {
                    Id = x.Id,
                    ProductId = x.ProductId,
                    ProductName = x.ProductName,
                    UnitPrice = x.UnitPrice,
                    Quantity = x.Quantity,
                    LineTotal = x.LineTotal
                })
                .ToList()
        };
}
