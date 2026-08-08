using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Supplier;
using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

public class SupplierRepository(SimpleShopDbContext db) : ISupplierRepository
{
    private static SupplierAddEditModel ToViewModel(Supplier s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        ContactPerson = s.ContactPerson,
        Phone = s.Phone,
        Email = s.Email,
        Address = s.Address,
        IsActive = s.IsActive
    };

    public async Task<OperationResult> Add(SupplierAddEditModel model)
    {
        var op = new OperationResult("Add Supplier");
        try
        {
            var entity = new Supplier
            {
                Name = model.Name,
                ContactPerson = model.ContactPerson,
                Phone = model.Phone,
                Email = model.Email,
                Address = model.Address,
                IsActive = model.IsActive
            };
            db.Suppliers.Add(entity);
            await db.SaveChangesAsync();
            return op.ToSuccess("تأمین‌کننده اضافه شد", entity.Id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> Update(SupplierAddEditModel model)
    {
        var op = new OperationResult("Update Supplier");
        try
        {
            var entity = await db.Suppliers.FirstOrDefaultAsync(x => x.Id == model.Id);
            if (entity == null) return op.ToFailed("تأمین‌کننده پیدا نشد");
            entity.Name = model.Name;
            entity.ContactPerson = model.ContactPerson;
            entity.Phone = model.Phone;
            entity.Email = model.Email;
            entity.Address = model.Address;
            entity.IsActive = model.IsActive;
            await db.SaveChangesAsync();
            return op.ToSuccess("تأمین‌کننده ویرایش شد", entity.Id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> Delete(int id)
    {
        var op = new OperationResult("Delete Supplier");
        try
        {
            var entity = await db.Suppliers.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null) return op.ToFailed("تأمین‌کننده پیدا نشد");
            db.Suppliers.Remove(entity);
            await db.SaveChangesAsync();
            return op.ToSuccess("تأمین‌کننده حذف شد", id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<SupplierAddEditModel?> Get(int id)
    {
        var entity = await db.Suppliers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return entity == null ? null : ToViewModel(entity);
    }

    public async Task<SupplierListComplex> Search(SupplierSearchModel searchModel)
    {
        if (searchModel.PageSize <= 0) searchModel.PageSize = 20;
        searchModel.PageIndex = Math.Max(0, searchModel.PageIndex);

        var query = db.Suppliers.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(searchModel.Search))
        {
            var term = searchModel.Search.Trim();
            query = query.Where(s => s.Name.Contains(term) || (s.ContactPerson != null && s.ContactPerson.Contains(term)));
        }

        var result = new SupplierListComplex { SearchModel = searchModel };
        result.SearchModel.RecordCount = await query.CountAsync();
        result.Items = await query.OrderBy(s => s.Name)
            .Skip(searchModel.PageIndex * searchModel.PageSize)
            .Take(searchModel.PageSize)
            .Select(s => new SupplierListItem
            {
                Id = s.Id,
                Name = s.Name,
                ContactPerson = s.ContactPerson,
                Phone = s.Phone,
                Email = s.Email,
                Address = s.Address,
                IsActive = s.IsActive,
                ProductCount = s.Products.Count
            })
            .ToListAsync();
        return result;
    }
}
