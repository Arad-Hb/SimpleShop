using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.User;
using Framework.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

public class UserRepository(
    SimpleShopDbContext db,
    UserManager<ApplicationUser> userManager,
    RoleManager<ApplicationRole> roleManager) : IUserRepository
{
    private static UserAddEditModel ToViewModel(ApplicationUser u, string role) => new()
    {
        Id = u.Id,
        Username = IdentityUserNames.ToDisplayMobile(u),
        Email = u.Email ?? string.Empty,
        FirstName = u.FirstName ?? string.Empty,
        LastName = u.LastName ?? string.Empty,
        Role = role,
        Phone = u.PhoneNumber,
        Address = u.Address,
        PostalCode = u.PostalCode,
        NationalId = u.NationalId,
        IsActive = u.IsActive,
        RegisterDate = u.RegisterDate,
        Password = null
    };

    private static LoginResultModel ToLoginSuccess(ApplicationUser user, string role) => new()
    {
        Success = true,
        Message = "ورود موفق",
        UserId = user.Id,
        Username = IdentityUserNames.ToDisplayMobile(user),
        Mobile = IdentityUserNames.ToDisplayMobile(user),
        FullName = user.DisplayName,
        Role = role
    };

    private static UserListItem MapListItem(ApplicationUser u, string role) => new()
    {
        Id = u.Id,
        Username = IdentityUserNames.ToDisplayMobile(u),
        Email = u.Email ?? string.Empty,
        FirstName = u.FirstName ?? string.Empty,
        LastName = u.LastName ?? string.Empty,
        FullName = u.DisplayName,
        Role = role,
        Phone = u.PhoneNumber,
        NationalId = u.NationalId,
        IsActive = u.IsActive,
        RegisterDate = u.RegisterDate,
        OrderCount = u.Orders.Count,
        HasOrders = u.Orders.Count > 0,
        TotalPurchase = u.Orders
            .Where(o => o.Status.Equals("delivered", StringComparison.OrdinalIgnoreCase))
            .Sum(o => o.TotalAmount)
    };

    private IQueryable<ApplicationUser> BuildSearchQuery(UserSearchModel searchModel)
    {
        var query = db.Users.AsNoTracking().Include(u => u.Orders).AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchModel.Search))
        {
            var term = searchModel.Search.Trim();
            var normalizedTerm = IdentityUserNames.NormalizeMobile(term);
            query = query.Where(u =>
                (u.UserName != null && u.UserName.Contains(term)) ||
                (u.Email != null && u.Email.Contains(term)) ||
                (u.FirstName != null && u.FirstName.Contains(term)) ||
                (u.LastName != null && u.LastName.Contains(term)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(term)) ||
                (u.NationalId != null && u.NationalId.Contains(term)) ||
                (!string.IsNullOrEmpty(normalizedTerm) && u.PhoneNumber == normalizedTerm));
        }

        if (searchModel.IsActive is not null)
            query = query.Where(u => u.IsActive == searchModel.IsActive);

        if (searchModel.HasOrders == true)
            query = query.Where(u => u.Orders.Any());
        else if (searchModel.HasOrders == false)
            query = query.Where(u => !u.Orders.Any());

        if (!string.IsNullOrWhiteSpace(searchModel.Role))
        {
            var roleName = searchModel.Role.Trim();
            query = from u in query
                    join ur in db.UserRoles on u.Id equals ur.UserId
                    join r in db.Roles on ur.RoleId equals r.Id
                    where r.Name == roleName
                    select u;
        }

        return query.Distinct().OrderBy(u => u.UserName);
    }

    private async Task<string?> GetPrimaryRoleAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        return roles.FirstOrDefault();
    }

    public async Task<bool> IsMobileTakenForRoleAsync(string mobile, string role)
    {
        var normalized = IdentityUserNames.NormalizeMobile(mobile);
        if (string.IsNullOrEmpty(normalized))
            return false;

        var userName = IdentityUserNames.BuildUserName(role, normalized);
        return await userManager.FindByNameAsync(userName) != null;
    }

    public async Task<LoginResultModel> RegisterAsync(RegisterModel model)
    {
        var role = model.Role?.Trim() ?? Roles.Customer;
        if (role is not (Roles.Customer or Roles.Supplier))
        {
            return new LoginResultModel
            {
                Success = false,
                Message = "ثبت‌نام فقط برای نقش مشتری یا تأمین‌کننده مجاز است."
            };
        }

        var mobile = IdentityUserNames.NormalizeMobile(model.Mobile);
        if (string.IsNullOrEmpty(mobile))
        {
            return new LoginResultModel
            {
                Success = false,
                Message = "فرمت شماره موبایل نامعتبر است. مثال: 09121234567"
            };
        }

        if (await IsMobileTakenForRoleAsync(mobile, role))
        {
            return new LoginResultModel
            {
                Success = false,
                Message = "این شماره قبلاً در این نقش ثبت شده است."
            };
        }

        var userName = IdentityUserNames.BuildUserName(role, mobile);
        var user = new ApplicationUser
        {
            UserName = userName,
            Email = string.IsNullOrWhiteSpace(model.Email)
                ? $"{userName.Replace(":", "_")}@simpleshop.local"
                : model.Email.Trim(),
            PhoneNumber = mobile,
            FirstName = model.FirstName?.Trim(),
            LastName = model.LastName?.Trim(),
            Address = model.Address,
            PostalCode = model.PostalCode,
            IsActive = true,
            RegisterDate = DateTime.UtcNow,
            EmailConfirmed = true,
            PhoneNumberConfirmed = true
        };

        var createResult = await userManager.CreateAsync(user, model.Password);
        if (!createResult.Succeeded)
        {
            return new LoginResultModel
            {
                Success = false,
                Message = string.Join(" ", createResult.Errors.Select(e => e.Description))
            };
        }

        await EnsureRoleExistsAsync(role);
        var roleResult = await userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
        {
            await userManager.DeleteAsync(user);
            return new LoginResultModel
            {
                Success = false,
                Message = string.Join(" ", roleResult.Errors.Select(e => e.Description))
            };
        }

        return ToLoginSuccess(user, role);
    }

    public async Task<OperationResult> Add(UserAddEditModel model)
    {
        var op = new OperationResult("Add User");
        try
        {
            if (string.IsNullOrWhiteSpace(model.Password))
                return op.ToFailed("رمز عبور الزامی است");

            var role = string.IsNullOrWhiteSpace(model.Role) ? Roles.Customer : model.Role;
            var mobile = IdentityUserNames.NormalizeMobile(model.Phone ?? model.Username);
            if (string.IsNullOrEmpty(mobile) && !string.Equals(model.Username, "admin", StringComparison.OrdinalIgnoreCase))
                return op.ToFailed("فرمت شماره موبایل نامعتبر است");

            if (await IsMobileTakenForRoleAsync(mobile, role))
                return op.ToFailed("این شماره قبلاً در این نقش ثبت شده است");

            var register = await RegisterAsync(new RegisterModel
            {
                Mobile = mobile,
                Password = model.Password,
                Role = role,
                FirstName = model.FirstName,
                LastName = model.LastName,
                Email = model.Email,
                Address = model.Address,
                PostalCode = model.PostalCode
            });

            if (!register.Success)
                return op.ToFailed(register.Message);

            if (!string.IsNullOrEmpty(register.UserId))
            {
                var created = await userManager.FindByIdAsync(register.UserId);
                if (created != null)
                {
                    if (!string.IsNullOrWhiteSpace(model.NationalId))
                        created.NationalId = model.NationalId.Trim();
                    created.IsActive = model.IsActive;
                    await userManager.UpdateAsync(created);
                }
            }

            return op.ToSuccess(register.Message, register.UserId!);
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
            var user = await userManager.FindByIdAsync(model.Id);
            if (user == null) return op.ToFailed("کاربر پیدا نشد");

            user.Email = string.IsNullOrWhiteSpace(model.Email) ? user.Email : model.Email.Trim();
            user.FirstName = model.FirstName?.Trim();
            user.LastName = model.LastName?.Trim();
            user.Address = model.Address;
            user.PostalCode = model.PostalCode;
            user.NationalId = string.IsNullOrWhiteSpace(model.NationalId) ? null : model.NationalId.Trim();
            user.IsActive = model.IsActive;

            var newMobile = IdentityUserNames.NormalizeMobile(model.Phone);
            if (!string.IsNullOrEmpty(newMobile))
                user.PhoneNumber = newMobile;

            if (!string.IsNullOrWhiteSpace(model.Password))
            {
                var token = await userManager.GeneratePasswordResetTokenAsync(user);
                var passResult = await userManager.ResetPasswordAsync(user, token, model.Password);
                if (!passResult.Succeeded)
                    return op.ToFailed(string.Join(" ", passResult.Errors.Select(e => e.Description)));
            }

            var updateResult = await userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                return op.ToFailed(string.Join(" ", updateResult.Errors.Select(e => e.Description)));

            return op.ToSuccess("کاربر ویرایش شد");
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> Delete(string id)
    {
        var op = new OperationResult("Delete User");
        try
        {
            if (await db.Orders.AnyAsync(o => o.UserId == id))
                return op.ToFailed("این مشتری سفارش دارد و قابل حذف نیست.");

            var user = await userManager.FindByIdAsync(id);
            if (user == null) return op.ToFailed("کاربر پیدا نشد");

            var result = await userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return op.ToFailed(string.Join(" ", result.Errors.Select(e => e.Description)));

            return op.ToSuccess("کاربر حذف شد");
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<UserAddEditModel?> Get(string id)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user == null) return null;
        var role = await GetPrimaryRoleAsync(user) ?? Roles.Customer;
        return ToViewModel(user, role);
    }

    public async Task<UserListItem?> GetListItem(string id)
    {
        var user = await db.Users.AsNoTracking()
            .Include(u => u.Orders)
            .FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return null;

        var role = await GetPrimaryRoleAsync(user) ?? Roles.Customer;
        return MapListItem(user, role);
    }

    public async Task<UserListComplex> Search(UserSearchModel searchModel)
    {
        searchModel.PageIndex = searchModel.PageIndex < 0 ? 0 : searchModel.PageIndex;
        if (searchModel.PageSize <= 0) searchModel.PageSize = 20;

        var query = BuildSearchQuery(searchModel);
        var result = new UserListComplex { SearchModel = searchModel };
        result.SearchModel.RecordCount = await query.CountAsync();

        var users = await query
            .Skip(searchModel.PageIndex * searchModel.PageSize)
            .Take(searchModel.PageSize)
            .ToListAsync();

        var items = new List<UserListItem>();
        foreach (var user in users)
        {
            var role = await GetPrimaryRoleAsync(user) ?? Roles.Customer;
            items.Add(MapListItem(user, role));
        }

        result.Items = items;
        return result;
    }

    public async Task<LoginResultModel> ValidateLogin(LoginModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Role))
        {
            return new LoginResultModel
            {
                Success = false,
                Message = "نقش کاربر برای ورود مشخص نشده است."
            };
        }

        var expectedRole = model.Role.Trim();
        if (expectedRole is not (Roles.Admin or Roles.Customer or Roles.Supplier))
        {
            return new LoginResultModel
            {
                Success = false,
                Message = "نقش نامعتبر است."
            };
        }

        if (!string.Equals(model.Username, "admin", StringComparison.OrdinalIgnoreCase)
            && !IdentityUserNames.IsValidMobile(model.Username))
        {
            return new LoginResultModel
            {
                Success = false,
                Message = "فرمت شماره موبایل نامعتبر است."
            };
        }

        string userName;
        try
        {
            userName = IdentityUserNames.ResolveLoginUserName(model.Username, expectedRole);
        }
        catch (ArgumentException ex)
        {
            return new LoginResultModel { Success = false, Message = ex.Message };
        }

        var user = await userManager.FindByNameAsync(userName);

        if (user == null || !user.IsActive)
        {
            return new LoginResultModel
            {
                Success = false,
                Message = "نام کاربری یا رمز عبور اشتباه است."
            };
        }

        if (!await userManager.CheckPasswordAsync(user, model.Password))
        {
            return new LoginResultModel
            {
                Success = false,
                Message = "نام کاربری یا رمز عبور اشتباه است."
            };
        }

        if (!await userManager.IsInRoleAsync(user, expectedRole))
        {
            return new LoginResultModel
            {
                Success = false,
                Message = "حسابی با این شماره برای این پنل یافت نشد."
            };
        }

        return ToLoginSuccess(user, expectedRole);
    }

    public async Task<(bool Success, string? UserId, string Message)> EnsureCustomerForGuestCheckoutAsync(
        string mobile, string? firstName, string? lastName, string? address, string? password)
    {
        var normalized = IdentityUserNames.NormalizeMobile(mobile);
        if (string.IsNullOrEmpty(normalized))
            return (false, null, "فرمت شماره موبایل نامعتبر است.");

        var userName = IdentityUserNames.BuildUserName(Roles.Customer, normalized);
        var existing = await userManager.FindByNameAsync(userName);
        if (existing != null)
        {
            if (!string.IsNullOrWhiteSpace(address) && string.IsNullOrWhiteSpace(existing.Address))
            {
                existing.Address = address.Trim();
                await userManager.UpdateAsync(existing);
            }
            return (true, existing.Id, string.Empty);
        }

        var pwd = string.IsNullOrWhiteSpace(password) ? "Guest123!" : password.Trim();
        if (pwd.Length < 6)
            return (false, null, "رمز عبور باید حداقل ۶ کاراکتر باشد.");

        var register = await RegisterAsync(new RegisterModel
        {
            Mobile = normalized,
            Password = pwd,
            Role = Roles.Customer,
            FirstName = firstName?.Trim(),
            LastName = lastName?.Trim(),
            Address = address?.Trim()
        });

        if (!register.Success)
            return (false, null, register.Message);

        return (true, register.UserId, string.Empty);
    }

    public async Task<LoginResultModel> EnsureCustomerAfterPaymentAsync(
        string mobile, string? firstName, string? lastName, string? address, string? postalCode)
    {
        var normalized = IdentityUserNames.NormalizeMobile(mobile);
        if (string.IsNullOrEmpty(normalized))
        {
            return new LoginResultModel
            {
                Success = false,
                Message = "فرمت شماره موبایل نامعتبر است."
            };
        }

        var userName = IdentityUserNames.BuildUserName(Roles.Customer, normalized);
        var existing = await userManager.FindByNameAsync(userName);
        if (existing != null)
        {
            var changed = false;
            if (!string.IsNullOrWhiteSpace(address) && string.IsNullOrWhiteSpace(existing.Address))
            {
                existing.Address = address.Trim();
                changed = true;
            }
            if (!string.IsNullOrWhiteSpace(postalCode) && string.IsNullOrWhiteSpace(existing.PostalCode))
            {
                existing.PostalCode = postalCode.Trim();
                changed = true;
            }
            if (changed) await userManager.UpdateAsync(existing);
            return ToLoginSuccess(existing, Roles.Customer);
        }

        var pwd = $"Pay{Guid.NewGuid():N}"[..12];
        return await RegisterAsync(new RegisterModel
        {
            Mobile = normalized,
            Password = pwd,
            Role = Roles.Customer,
            FirstName = firstName?.Trim(),
            LastName = lastName?.Trim(),
            Address = address?.Trim(),
            PostalCode = postalCode?.Trim()
        });
    }

    public async Task<LoginResultModel?> GetCustomerLoginResultByUserIdAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null) return null;
        var roles = await userManager.GetRolesAsync(user);
        if (!roles.Contains(Roles.Customer)) return null;
        return ToLoginSuccess(user, Roles.Customer);
    }

    public async Task<UserAddEditModel?> GetProfileAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user == null) return null;
        var role = await GetPrimaryRoleAsync(user) ?? Roles.Admin;
        return ToViewModel(user, role);
    }

    public async Task<OperationResult> UpdateProfileAsync(string userId, ProfileUpdateModel model)
    {
        var op = new OperationResult("Update Profile");
        try
        {
            var user = await userManager.FindByIdAsync(userId);
            if (user == null) return op.ToFailed("کاربر پیدا نشد");

            user.Email = string.IsNullOrWhiteSpace(model.Email) ? user.Email : model.Email.Trim();
            user.FirstName = model.FirstName?.Trim();
            user.LastName = model.LastName?.Trim();

            var newMobile = IdentityUserNames.NormalizeMobile(model.Phone);
            if (!string.IsNullOrEmpty(newMobile) && !string.Equals(user.UserName, "admin", StringComparison.OrdinalIgnoreCase))
                user.PhoneNumber = newMobile;

            var updateResult = await userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                return op.ToFailed(string.Join(" ", updateResult.Errors.Select(e => e.Description)));

            return op.ToSuccess("پروفایل بروزرسانی شد");
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> ChangePasswordAsync(string userId, ChangePasswordModel model)
    {
        var op = new OperationResult("Change Password");
        try
        {
            if (model.NewPassword != model.ConfirmPassword)
                return op.ToFailed("رمز عبور جدید و تکرار آن یکسان نیست.");

            var user = await userManager.FindByIdAsync(userId);
            if (user == null) return op.ToFailed("کاربر پیدا نشد");

            if (!await userManager.CheckPasswordAsync(user, model.CurrentPassword))
                return op.ToFailed("رمز عبور فعلی اشتباه است.");

            var result = await userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
            if (!result.Succeeded)
                return op.ToFailed(string.Join(" ", result.Errors.Select(e => e.Description)));

            return op.ToSuccess("رمز عبور با موفقیت تغییر کرد");
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    private async Task EnsureRoleExistsAsync(string roleName)
    {
        if (await roleManager.RoleExistsAsync(roleName)) return;
        await roleManager.CreateAsync(new ApplicationRole
        {
            Name = roleName,
            Description = roleName
        });
    }
}
