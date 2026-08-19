using DomainModel.Context;
using Microsoft.EntityFrameworkCore;
using OrderEntity = DomainModel.Models.Order;

namespace DataAccess.Repositories.Orders;

public class OrderRepository(ApplicationDbContext context) : IOrderRepository
{
    public IQueryable<OrderEntity> Query(bool tracking = false)
        => tracking ? context.Orders : context.Orders.AsNoTracking();

    public Task<OrderEntity?> GetByIdAsync(int id, bool tracking = true)
        => Query(tracking)
            .Include(x => x.User)
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.Id == id);

    public Task AddAsync(OrderEntity entity) => context.Orders.AddAsync(entity).AsTask();

    public Task<int> SaveChangesAsync() => context.SaveChangesAsync();
}
