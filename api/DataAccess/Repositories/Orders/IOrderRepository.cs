using DomainModel.ViewModels.Order;
using OrderEntity = DomainModel.Models.Order;

namespace DataAccess.Repositories.Orders;

public interface IOrderRepository
{
    IQueryable<OrderEntity> Query(bool tracking = false);
    Task<OrderEntity?> GetByIdAsync(int id, bool tracking = true);
    Task AddAsync(OrderEntity entity);
    Task<int> SaveChangesAsync();
}
