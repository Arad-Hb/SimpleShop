using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Cart;
using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

public class CartRepository(SimpleShopDbContext db) : ICartRepository
{
    private static CartItemAddEditModel ToViewModel(CartItem item) => new()
    {
        Id = item.Id,
        CustomerId = item.CustomerId,
        ProductId = item.ProductId,
        Quantity = item.Quantity
    };

    public async Task<OperationResult> Add(CartItemAddEditModel model)
    {
        var op = new OperationResult("Add Cart Item");
        try
        {
            var product = await db.Products.FirstOrDefaultAsync(p => p.Id == model.ProductId);
            if (product == null) return op.ToFailed("محصول پیدا نشد");
            if (model.Quantity < 1 || model.Quantity > product.Stock)
                return op.ToFailed("موجودی کافی نیست");

            var existing = await db.CartItems
                .FirstOrDefaultAsync(ci => ci.CustomerId == model.CustomerId && ci.ProductId == model.ProductId);

            if (existing != null)
            {
                var newQty = existing.Quantity + model.Quantity;
                if (newQty > product.Stock) return op.ToFailed("موجودی کافی نیست");
                existing.Quantity = newQty;
                await db.SaveChangesAsync();
                return op.ToSuccess("سبد به‌روزرسانی شد", existing.Id);
            }

            var entity = new CartItem
            {
                CustomerId = model.CustomerId,
                ProductId = model.ProductId,
                Quantity = model.Quantity
            };
            db.CartItems.Add(entity);
            await db.SaveChangesAsync();
            return op.ToSuccess("به سبد اضافه شد", entity.Id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> Update(CartItemAddEditModel model)
    {
        var op = new OperationResult("Update Cart Item");
        try
        {
            var item = await db.CartItems.Include(ci => ci.Product)
                .FirstOrDefaultAsync(ci => ci.Id == model.Id && ci.CustomerId == model.CustomerId);
            if (item == null) return op.ToFailed("آیتم پیدا نشد");
            if (model.Quantity < 1 || model.Quantity > item.Product.Stock)
                return op.ToFailed("موجودی کافی نیست");

            item.Quantity = model.Quantity;
            await db.SaveChangesAsync();
            return op.ToSuccess("سبد ویرایش شد", item.Id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> Delete(int id)
    {
        var op = new OperationResult("Delete Cart Item");
        try
        {
            var item = await db.CartItems.FirstOrDefaultAsync(ci => ci.Id == id);
            if (item == null) return op.ToFailed("آیتم پیدا نشد");
            db.CartItems.Remove(item);
            await db.SaveChangesAsync();
            return op.ToSuccess("از سبد حذف شد", id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<CartItemAddEditModel?> Get(int id)
    {
        var item = await db.CartItems.AsNoTracking().FirstOrDefaultAsync(ci => ci.Id == id);
        return item == null ? null : ToViewModel(item);
    }

    public async Task<CartListComplex> Search(CartSearchModel searchModel)
    {
        if (searchModel.PageSize <= 0) searchModel.PageSize = 100;
        searchModel.PageIndex = Math.Max(0, searchModel.PageIndex);

        var query = db.CartItems.AsNoTracking()
            .Include(ci => ci.Product)
            .Where(ci => ci.CustomerId == searchModel.CustomerId);

        var result = new CartListComplex { SearchModel = searchModel };
        result.SearchModel.RecordCount = await query.CountAsync();
        result.Items = await query
            .OrderBy(ci => ci.Id)
            .Skip(searchModel.PageIndex * searchModel.PageSize)
            .Take(searchModel.PageSize)
            .Select(ci => new CartItemListItem
            {
                Id = ci.Id,
                ProductId = ci.ProductId,
                ProductName = ci.Product.Name,
                UnitPrice = ci.Product.Price,
                Quantity = ci.Quantity
            })
            .ToListAsync();
        return result;
    }

    public async Task<OperationResult> Clear(int customerId)
    {
        var op = new OperationResult("Clear Cart");
        try
        {
            var items = await db.CartItems.Where(ci => ci.CustomerId == customerId).ToListAsync();
            db.CartItems.RemoveRange(items);
            await db.SaveChangesAsync();
            return op.ToSuccess("سبد خالی شد");
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }
}
