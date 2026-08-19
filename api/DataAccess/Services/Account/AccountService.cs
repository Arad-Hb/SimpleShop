using DomainModel.Models;
using DomainModel.ViewModels.Account;
using Framework.Common;
using Framework.Common.Constants;
using Framework.Common.Helpers;
using Microsoft.AspNetCore.Identity;

namespace DataAccess.Services.Account;

public class AccountService(
    UserManager<ApplicationUser> userManager,
    IJwtTokenGenerator jwtTokenGenerator) : IAccountService
{
    public async Task<OperationResult> RegisterAsync(RegisterModel model)
    {
        var result = new OperationResult("ثبت‌نام");
        var mobile = MobileHelper.Normalize(model.MobileNumber);
        if (mobile is null)
            return result.ToFailed("شماره موبایل معتبر نیست.");

        if (await userManager.FindByNameAsync(mobile) is not null)
            return result.ToFailed("این شماره موبایل قبلاً ثبت شده است.");

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            FirstName = model.FirstName.Trim(),
            LastName = model.LastName.Trim(),
            UserName = mobile,
            PhoneNumber = mobile,
            PhoneNumberConfirmed = true,
            IsActive = true,
            CreateDate = DateTime.Now
        };

        var create = await userManager.CreateAsync(user, model.Password);
        if (!create.Succeeded)
            return result.ToFailed(string.Join(" | ", create.Errors.Select(x => x.Description)));

        var role = await userManager.AddToRoleAsync(user, RoleNames.Customer);
        if (!role.Succeeded)
        {
            await userManager.DeleteAsync(user);
            return result.ToFailed("ثبت نقش کاربر انجام نشد.");
        }

        return result.ToSuccess("ثبت‌نام با موفقیت انجام شد.");
    }

    public async Task<LoginResultModel?> LoginAsync(LoginModel model)
    {
        var mobile = MobileHelper.Normalize(model.MobileNumber) ?? model.MobileNumber.Trim();
        var user = await userManager.FindByNameAsync(mobile);
        if (user is null || !user.IsActive)
            return null;

        if (!await userManager.CheckPasswordAsync(user, model.Password))
            return null;

        var roles = await userManager.GetRolesAsync(user);
        return jwtTokenGenerator.Generate(user, roles, model.RememberMe);
    }

    public Task<OperationResult> LogoutAsync(string? userId)
        => Task.FromResult(new OperationResult("خروج").ToSuccess("خروج با موفقیت انجام شد."));

    public async Task<AuthenticatedUserModel?> GetAuthenticatedUserAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
            return null;

        var roles = await userManager.GetRolesAsync(user);
        return new AuthenticatedUserModel
        {
            UserID = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            MobileNumber = user.PhoneNumber ?? user.UserName ?? string.Empty,
            Address = user.Address,
            PostalCode = user.PostalCode,
            AvatarPath = user.AvatarPath,
            Roles = roles.ToList()
        };
    }

    public async Task<OperationResult> UpdateProfileAsync(string userId, ProfileUpdateModel model)
    {
        var result = new OperationResult("ویرایش پروفایل");
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
            return result.ToFailed("کاربر پیدا نشد.");

        user.FirstName = model.FirstName.Trim();
        user.LastName = model.LastName.Trim();
        user.Address = string.IsNullOrWhiteSpace(model.Address) ? null : model.Address.Trim();
        user.PostalCode = string.IsNullOrWhiteSpace(model.PostalCode) ? null : model.PostalCode.Trim();

        var update = await userManager.UpdateAsync(user);
        return update.Succeeded
            ? result.ToSuccess("پروفایل با موفقیت ذخیره شد.")
            : result.ToFailed("ذخیره پروفایل انجام نشد.");
    }

    public async Task<OperationResult> ChangePasswordAsync(string userId, ChangePasswordModel model)
    {
        var result = new OperationResult("تغییر رمز عبور");
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
            return result.ToFailed("کاربر پیدا نشد.");

        var changed = await userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        return changed.Succeeded
            ? result.ToSuccess("رمز عبور با موفقیت تغییر کرد.")
            : result.ToFailed(string.Join(" | ", changed.Errors.Select(x => x.Description)));
    }

    public async Task<OperationResult> UpdateAvatarPathAsync(string userId, string avatarPath)
    {
        var result = new OperationResult("تصویر کاربر");
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
            return result.ToFailed("کاربر پیدا نشد.");

        user.AvatarPath = avatarPath;
        var update = await userManager.UpdateAsync(user);
        return update.Succeeded
            ? result.ToSuccess("تصویر کاربر ذخیره شد.")
            : result.ToFailed("ذخیره تصویر کاربر انجام نشد.");
    }

    public async Task<string?> GetAvatarPathAsync(string userId)
        => (await userManager.FindByIdAsync(userId))?.AvatarPath;

    public async Task<bool> MobileExistsAsync(string mobileNumber)
    {
        var mobile = MobileHelper.Normalize(mobileNumber) ?? mobileNumber.Trim();
        return await userManager.FindByNameAsync(mobile) is not null;
    }
}
