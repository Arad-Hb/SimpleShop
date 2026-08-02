using Microsoft.EntityFrameworkCore;
using SimpleShop.Data;
using SimpleShop.Models.DTOs;
using SimpleShop.Models.Entities;

namespace SimpleShop.Services;

public interface ICartService
{
    Task<List<CartItemDto>> GetCartAsync(int customerId);
    Task<CartItemDto?> AddItemAsync(int customerId, CartItemCreateDto dto);
    Task<CartItemDto?> UpdateItemAsync(int customerId, int itemId, CartItemUpdateDto dto);
    Task<bool> RemoveItemAsync(int customerId, int itemId);
    Task ClearCartAsync(int customerId);
}

public class CartService : ICartService
{
    private readonly ShopDbContext _context;

    public CartService(ShopDbContext context) => _context = context;

    public async Task<List<CartItemDto>> GetCartAsync(int customerId)
    {
        return await _context.CartItems
            .Include(ci => ci.Product)
            .Where(ci => ci.CustomerId == customerId)
            .Select(ci => new CartItemDto
            {
                Id = ci.Id,
                ProductId = ci.ProductId,
                ProductName = ci.Product.Name,
                UnitPrice = ci.Product.Price,
                Quantity = ci.Quantity,
                Stock = ci.Product.Stock
            })
            .ToListAsync();
    }

    public async Task<CartItemDto?> AddItemAsync(int customerId, CartItemCreateDto dto)
    {
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null || product.Stock < dto.Quantity)
            return null;

        var existing = await _context.CartItems
            .FirstOrDefaultAsync(ci => ci.CustomerId == customerId && ci.ProductId == dto.ProductId);

        if (existing != null)
        {
            var newQty = existing.Quantity + dto.Quantity;
            if (newQty > product.Stock) return null;
            existing.Quantity = newQty;
        }
        else
        {
            _context.CartItems.Add(new CartItem
            {
                CustomerId = customerId,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity
            });
        }

        await _context.SaveChangesAsync();
        return (await GetCartAsync(customerId)).FirstOrDefault(ci => ci.ProductId == dto.ProductId);
    }

    public async Task<CartItemDto?> UpdateItemAsync(int customerId, int itemId, CartItemUpdateDto dto)
    {
        var item = await _context.CartItems
            .Include(ci => ci.Product)
            .FirstOrDefaultAsync(ci => ci.Id == itemId && ci.CustomerId == customerId);

        if (item == null || dto.Quantity <= 0 || dto.Quantity > item.Product.Stock)
            return null;

        item.Quantity = dto.Quantity;
        await _context.SaveChangesAsync();

        return new CartItemDto
        {
            Id = item.Id,
            ProductId = item.ProductId,
            ProductName = item.Product.Name,
            UnitPrice = item.Product.Price,
            Quantity = item.Quantity,
            Stock = item.Product.Stock
        };
    }

    public async Task<bool> RemoveItemAsync(int customerId, int itemId)
    {
        var item = await _context.CartItems
            .FirstOrDefaultAsync(ci => ci.Id == itemId && ci.CustomerId == customerId);

        if (item == null) return false;

        _context.CartItems.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task ClearCartAsync(int customerId)
    {
        var items = await _context.CartItems.Where(ci => ci.CustomerId == customerId).ToListAsync();
        _context.CartItems.RemoveRange(items);
        await _context.SaveChangesAsync();
    }
}
