using DomainModel.ViewModels.Account;
using Framework.Common;

namespace DataAccess.Services.Account;

public interface IJwtTokenGenerator
{
    LoginResultModel Generate(DomainModel.Models.ApplicationUser user, IList<string> roles, bool rememberMe);
}

public interface IAccountService
{
    Task<OperationResult> RegisterAsync(RegisterModel model);
    Task<LoginResultModel?> LoginAsync(LoginModel model);
    Task<OperationResult> LogoutAsync(string? userId);
    Task<AuthenticatedUserModel?> GetAuthenticatedUserAsync(string userId);
    Task<OperationResult> UpdateProfileAsync(string userId, ProfileUpdateModel model);
    Task<OperationResult> ChangePasswordAsync(string userId, ChangePasswordModel model);
    Task<OperationResult> UpdateAvatarPathAsync(string userId, string avatarPath);
    Task<string?> GetAvatarPathAsync(string userId);
    Task<bool> MobileExistsAsync(string mobileNumber);
}
