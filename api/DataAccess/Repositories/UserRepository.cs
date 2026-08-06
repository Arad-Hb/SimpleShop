using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.User;
using Framework.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

public class UserRepository(
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

            return register.Success
                ? op.ToSuccess(register.Message)
                : op.ToFailed(register.Message);
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

    public async Task<UserListComplex> Search(UserSearchModel searchModel)
    {
        if (searchModel.PageSize <= 0) searchModel.PageSize = 20;
        searchModel.PageIndex = Math.Max(0, searchModel.PageIndex);

        var query = userManager.Users.AsNoTracking().AsQueryable();

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
                (!string.IsNullOrEmpty(normalizedTerm) && u.PhoneNumber == normalizedTerm));
        }

        var result = new UserListComplex { SearchModel = searchModel };
        var users = await query.OrderBy(u => u.UserName).ToListAsync();
        var filtered = new List<UserListItem>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? Roles.Customer;
            if (!string.IsNullOrWhiteSpace(searchModel.Role) && role != searchModel.Role)
                continue;

            filtered.Add(new UserListItem
            {
                Id = user.Id,
                Username = IdentityUserNames.ToDisplayMobile(user),
                Email = user.Email ?? string.Empty,
                FullName = user.DisplayName,
                Role = role,
                Phone = user.PhoneNumber
            });
        }

        result.SearchModel.RecordCount = filtered.Count;
        result.Items = filtered
            .Skip(searchModel.PageIndex * searchModel.PageSize)
            .Take(searchModel.PageSize)
            .ToList();
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
