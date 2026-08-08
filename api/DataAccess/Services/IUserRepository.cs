using DomainModel.ViewModels.User;
using Framework.Common;
using Framework.Services;

namespace DataAccess.Services;

public interface IUserRepository
    : IBaseRepositorySearchable<UserAddEditModel, string, UserListItem, UserSearchModel, UserListComplex>
{
    Task<UserListItem?> GetListItem(string id);
    Task<LoginResultModel> ValidateLogin(LoginModel model);
    Task<LoginResultModel> RegisterAsync(RegisterModel model);
    Task<bool> IsMobileTakenForRoleAsync(string mobile, string role);
    Task<(bool Success, string? UserId, string Message)> EnsureCustomerForGuestCheckoutAsync(
        string mobile, string? firstName, string? lastName, string? address, string? password);
    Task<LoginResultModel> EnsureCustomerAfterPaymentAsync(
        string mobile, string? firstName, string? lastName, string? address, string? postalCode);
    Task<LoginResultModel?> GetCustomerLoginResultByUserIdAsync(string userId);
    Task<UserAddEditModel?> GetProfileAsync(string userId);
    Task<OperationResult> UpdateProfileAsync(string userId, ProfileUpdateModel model);
    Task<OperationResult> ChangePasswordAsync(string userId, ChangePasswordModel model);
}
