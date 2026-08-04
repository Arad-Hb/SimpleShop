using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.User;
using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

public class UserRepository(SimpleShopDbContext db) : IUserRepository
{
    private static UserAddEditModel ToViewModel(User u) => new()
    {
        Id = u.Id,
        Username = u.Username,
        Email = u.Email,
        FullName = u.FullName,
        Role = u.Role,
        Phone = u.Customer?.Phone,
        Address = u.Customer?.Address,
        Password = null
    };

    public async Task<OperationResult> Add(UserAddEditModel model)
    {
        var op = new OperationResult("Add User");
        try
        {
            if (string.IsNullOrWhiteSpace(model.Password))
                return op.ToFailed("رمز عبور الزامی است");

            if (await db.Users.AnyAsync(u => u.Username == model.Username || u.Email == model.Email))
                return op.ToFailed("نام کاربری یا ایمیل تکراری است");

            var role = string.IsNullOrWhiteSpace(model.Role) ? Roles.Customer : model.Role;
            var user = new User
            {
                Username = model.Username.Trim(),
                Email = model.Email.Trim(),
                FullName = model.FullName?.Trim() ?? string.Empty,
                Role = role,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password)
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            if (role == Roles.Customer)
            {
                db.Customers.Add(new Customer
                {
                    UserId = user.Id,
                    Phone = model.Phone,
                    Address = model.Address
                });
                await db.SaveChangesAsync();
            }

            return op.ToSuccess("کاربر ثبت شد", user.Id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> Update(UserAddEditModel model)
    {
        var op = new OperationResult("Update User");
        try
        {
            var user = await db.Users.Include(u => u.Customer).FirstOrDefaultAsync(u => u.Id == model.Id);
            if (user == null) return op.ToFailed("کاربر پیدا نشد");

            if (await db.Users.AnyAsync(u => u.Id != model.Id && (u.Username == model.Username || u.Email == model.Email)))
                return op.ToFailed("نام کاربری یا ایمیل تکراری است");

            user.Username = model.Username.Trim();
            user.Email = model.Email.Trim();
            user.FullName = model.FullName?.Trim() ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(model.Role))
                user.Role = model.Role;

            if (!string.IsNullOrWhiteSpace(model.Password))
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);

            if (user.Customer != null)
            {
                user.Customer.Phone = model.Phone;
                user.Customer.Address = model.Address;
            }

            await db.SaveChangesAsync();
            return op.ToSuccess("کاربر ویرایش شد", user.Id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> Delete(int id)
    {
        var op = new OperationResult("Delete User");
        try
        {
            var user = await db.Users.Include(u => u.Customer).FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return op.ToFailed("کاربر پیدا نشد");

            if (user.Customer != null)
                db.Customers.Remove(user.Customer);

            db.Users.Remove(user);
            await db.SaveChangesAsync();
            return op.ToSuccess("کاربر حذف شد", id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<UserAddEditModel?> Get(int id)
    {
        var user = await db.Users.AsNoTracking()
            .Include(u => u.Customer)
            .FirstOrDefaultAsync(u => u.Id == id);
        return user == null ? null : ToViewModel(user);
    }

    public async Task<UserListComplex> Search(UserSearchModel searchModel)
    {
        if (searchModel.PageSize <= 0) searchModel.PageSize = 20;
        searchModel.PageIndex = Math.Max(0, searchModel.PageIndex);

        var query = db.Users.AsNoTracking().Include(u => u.Customer).AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchModel.Search))
        {
            var term = searchModel.Search.Trim();
            query = query.Where(u =>
                u.Username.Contains(term) ||
                u.Email.Contains(term) ||
                u.FullName.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(searchModel.Role))
            query = query.Where(u => u.Role == searchModel.Role);

        var result = new UserListComplex { SearchModel = searchModel };
        result.SearchModel.RecordCount = await query.CountAsync();
        result.Items = await query.OrderBy(u => u.Username)
            .Skip(searchModel.PageIndex * searchModel.PageSize)
            .Take(searchModel.PageSize)
            .Select(u => new UserListItem
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullName = u.FullName,
                Role = u.Role,
                CustomerId = u.Customer != null ? u.Customer.Id : null
            })
            .ToListAsync();
        return result;
    }

    public async Task<LoginResultModel> ValidateLogin(LoginModel model)
    {
        var user = await db.Users.AsNoTracking()
            .Include(u => u.Customer)
            .FirstOrDefaultAsync(u => u.Username == model.Username);

        if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash))
        {
            return new LoginResultModel
            {
                Success = false,
                Message = "نام کاربری یا رمز عبور اشتباه است."
            };
        }

        return new LoginResultModel
        {
            Success = true,
            Message = "ورود موفق",
            UserId = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Role = user.Role,
            CustomerId = user.Customer?.Id
        };
    }
}
