using DataAccess.Repositories.Customers;
using DataAccess.Services.Common;
using DomainModel.Context;
using DomainModel.Models;
using DomainModel.ViewModels.Customer;
using Framework.Common;
using Framework.Common.Constants;
using Framework.Common.Helpers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Services.Customers;

public class CustomerService(
    ApplicationDbContext context,
    UserManager<ApplicationUser> userManager,
    IPaginationService pagination) : ICustomerService
{
    public async Task<CustomerListComplex> SearchAsync(CustomerSearchModel model)
    {
        var customerIds = await (
            from user in context.Users
            join userRole in context.UserRoles on user.Id equals userRole.UserId
            join role in context.Roles on userRole.RoleId equals role.Id
            where role.Name == RoleNames.Customer
            select user.Id).ToListAsync();

        var query = context.Users.AsNoTracking().Where(x => customerIds.Contains(x.Id));

        if (!string.IsNullOrWhiteSpace(model.Term))
        {
            var term = model.Term.Trim();
            query = query.Where(x =>
                x.FirstName.Contains(term) ||
                x.LastName.Contains(term) ||
                (x.PhoneNumber != null && x.PhoneNumber.Contains(term)) ||
                (x.UserName != null && x.UserName.Contains(term)));
        }

        if (model.IsActive.HasValue)
            query = query.Where(x => x.IsActive == model.IsActive);

        query = query.OrderByDescending(x => x.CreateDate);
        var rows = await pagination.PaginateAsync(query, model);
        var ids = rows.Select(x => x.Id).ToList();
        var counts = await context.Orders
            .Where(x => ids.Contains(x.UserId))
            .GroupBy(x => x.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        return new CustomerListComplex
        {
            Items = rows.Select(x => CustomerMapper.ToListItem(x, counts.GetValueOrDefault(x.Id))).ToList(),
            Page = model
        };
    }

    public async Task<CustomerDetailsModel?> GetAsync(string id)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null || !await userManager.IsInRoleAsync(user, RoleNames.Customer))
            return null;

        var count = await context.Orders.CountAsync(x => x.UserId == id);
        return CustomerMapper.ToDetails(user, count);
    }

    public async Task<OperationResult> AddAsync(CustomerAddEditModel model)
    {
        var result = new OperationResult("افزودن مشتری");
        var mobile = MobileHelper.Normalize(model.MobileNumber);
        if (mobile is null)
            return result.ToFailed("شماره موبایل معتبر نیست.");

        if (await userManager.FindByNameAsync(mobile) is not null)
            return result.ToFailed("این شماره موبایل قبلاً ثبت شده است.");

        if (string.IsNullOrWhiteSpace(model.Password))
            return result.ToFailed("رمز عبور برای مشتری جدید الزامی است.");

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            FirstName = model.FirstName.Trim(),
            LastName = model.LastName.Trim(),
            UserName = mobile,
            PhoneNumber = mobile,
            PhoneNumberConfirmed = true,
            Address = string.IsNullOrWhiteSpace(model.Address) ? null : model.Address.Trim(),
            PostalCode = string.IsNullOrWhiteSpace(model.PostalCode) ? null : model.PostalCode.Trim(),
            IsActive = model.IsActive,
            CreateDate = DateTime.Now
        };

        var create = await userManager.CreateAsync(user, model.Password);
        if (!create.Succeeded)
            return result.ToFailed(string.Join(" | ", create.Errors.Select(x => x.Description)));

        var role = await userManager.AddToRoleAsync(user, RoleNames.Customer);
        if (!role.Succeeded)
        {
            await userManager.DeleteAsync(user);
            return result.ToFailed("ثبت نقش مشتری انجام نشد.");
        }

        return result.ToSuccess("مشتری با موفقیت اضافه شد.");
    }

    public async Task<OperationResult> UpdateAsync(string id, CustomerAddEditModel model)
    {
        var result = new OperationResult("ویرایش مشتری");
        var user = await userManager.FindByIdAsync(id);
        if (user is null || !await userManager.IsInRoleAsync(user, RoleNames.Customer))
            return result.ToFailed("مشتری پیدا نشد.");

        user.FirstName = model.FirstName.Trim();
        user.LastName = model.LastName.Trim();
        user.Address = string.IsNullOrWhiteSpace(model.Address) ? null : model.Address.Trim();
        user.PostalCode = string.IsNullOrWhiteSpace(model.PostalCode) ? null : model.PostalCode.Trim();
        user.IsActive = model.IsActive;

        var update = await userManager.UpdateAsync(user);
        if (!update.Succeeded)
            return result.ToFailed("ذخیره مشتری انجام نشد.");

        if (!string.IsNullOrWhiteSpace(model.Password))
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            var reset = await userManager.ResetPasswordAsync(user, token, model.Password);
            if (!reset.Succeeded)
                return result.ToFailed("اطلاعات مشتری ذخیره شد ولی تغییر رمز عبور انجام نشد.");
        }

        return result.ToSuccess("مشتری با موفقیت ویرایش شد.");
    }

    public async Task<OperationResult> SetActiveAsync(string id, bool isActive)
    {
        var result = new OperationResult(isActive ? "فعال‌سازی مشتری" : "غیرفعال‌سازی مشتری");
        var user = await userManager.FindByIdAsync(id);
        if (user is null || !await userManager.IsInRoleAsync(user, RoleNames.Customer))
            return result.ToFailed("مشتری پیدا نشد.");

        user.IsActive = isActive;
        var update = await userManager.UpdateAsync(user);
        return update.Succeeded
            ? result.ToSuccess(isActive ? "مشتری فعال شد." : "مشتری غیرفعال شد.")
            : result.ToFailed("تغییر وضعیت مشتری انجام نشد.");
    }
}
