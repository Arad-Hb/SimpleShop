using Microsoft.EntityFrameworkCore;
using SimpleShop.Data;
using SimpleShop.Models;
using SimpleShop.Models.DTOs;
using SimpleShop.Models.Entities;

namespace SimpleShop.Services;

public interface IOrderService
{
    Task<List<OrderDto>> GetAllAsync();
    Task<List<OrderDto>> GetByCustomerAsync(int customerId);
    Task<OrderDto?> GetByIdAsync(int id);
    Task<OrderDto?> CreateFromCartAsync(int customerId, CreateOrderDto dto);
    Task<OrderDto?> UpdateStatusAsync(int id, string status);
}

public class OrderService : IOrderService
{
    private readonly ShopDbContext _context;
    private readonly ICartService _cartService;

    public OrderService(ShopDbContext context, ICartService cartService)
    {
        _context = context;
        _cartService = cartService;
    }

    public async Task<List<OrderDto>> GetAllAsync()
    {
        var orders = await _context.Orders
            .Include(o => o.Customer).ThenInclude(c => c.User)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

        return orders.Select(MapToDto).ToList();
    }

    public async Task<List<OrderDto>> GetByCustomerAsync(int customerId)
    {
        var orders = await _context.Orders
            .Include(o => o.Customer).ThenInclude(c => c.User)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

        return orders.Select(MapToDto).ToList();
    }

    public async Task<OrderDto?> GetByIdAsync(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Customer).ThenInclude(c => c.User)
            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        return order == null ? null : MapToDto(order);
    }

    public async Task<OrderDto?> CreateFromCartAsync(int customerId, CreateOrderDto dto)
    {
        var cartItems = await _context.CartItems
            .Include(ci => ci.Product)
            .Where(ci => ci.CustomerId == customerId)
            .ToListAsync();

        if (!cartItems.Any()) return null;

        foreach (var item in cartItems)
        {
            if (item.Quantity > item.Product.Stock)
                return null;
        }

        var customer = await _context.Customers.FindAsync(customerId);
        if (customer == null) return null;

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var order = new Order
            {
                CustomerId = customerId,
                Status = OrderStatus.Pending,
                ShippingAddress = dto.ShippingAddress ?? customer.Address,
                OrderItems = cartItems.Select(ci => new OrderItem
                {
                    ProductId = ci.ProductId,
                    Quantity = ci.Quantity,
                    UnitPrice = ci.Product.Price
                }).ToList()
            };

            order.TotalAmount = order.OrderItems.Sum(oi => oi.UnitPrice * oi.Quantity);

            foreach (var item in cartItems)
            {
                item.Product.Stock -= item.Quantity;
            }

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            await _cartService.ClearCartAsync(customerId);
            await transaction.CommitAsync();

            return await GetByIdAsync(order.Id);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<OrderDto?> UpdateStatusAsync(int id, string status)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return null;

        order.Status = status;
        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    private static OrderDto MapToDto(Order o) => new()
    {
        Id = o.Id,
        CustomerId = o.CustomerId,
        CustomerName = o.Customer.User.FullName,
        OrderDate = o.OrderDate,
        Status = o.Status,
        TotalAmount = o.TotalAmount,
        ShippingAddress = o.ShippingAddress,
        Items = o.OrderItems.Select(oi => new OrderItemDto
        {
            ProductId = oi.ProductId,
            ProductName = oi.Product.Name,
            Quantity = oi.Quantity,
            UnitPrice = oi.UnitPrice
        }).ToList()
    };
}
