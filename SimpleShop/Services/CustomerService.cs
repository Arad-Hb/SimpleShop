using Microsoft.EntityFrameworkCore;
using SimpleShop.Data;
using SimpleShop.Models.DTOs;

namespace SimpleShop.Services;

public interface ICustomerService
{
    Task<List<CustomerDto>> GetAllAsync();
    Task<CustomerDto?> GetByIdAsync(int id);
    Task<CustomerDto?> UpdateAsync(int id, CustomerUpdateDto dto);
}

public class CustomerService : ICustomerService
{
    private readonly ShopDbContext _context;

    public CustomerService(ShopDbContext context) => _context = context;

    public async Task<List<CustomerDto>> GetAllAsync()
    {
        return await _context.Customers
            .Include(c => c.User)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                Username = c.User.Username,
                Email = c.User.Email,
                FullName = c.User.FullName,
                Phone = c.Phone,
                Address = c.Address,
                OrderCount = c.Orders.Count,
                CreatedAt = c.User.CreatedAt
            })
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<CustomerDto?> GetByIdAsync(int id)
    {
        return await _context.Customers
            .Include(c => c.User)
            .Where(c => c.Id == id)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                Username = c.User.Username,
                Email = c.User.Email,
                FullName = c.User.FullName,
                Phone = c.Phone,
                Address = c.Address,
                OrderCount = c.Orders.Count,
                CreatedAt = c.User.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<CustomerDto?> UpdateAsync(int id, CustomerUpdateDto dto)
    {
        var customer = await _context.Customers
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null) return null;

        customer.User.FullName = dto.FullName;
        customer.Phone = dto.Phone;
        customer.Address = dto.Address;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }
}
