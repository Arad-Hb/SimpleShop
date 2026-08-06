using DomainModel.ViewModels.User;
using Framework.Services;

namespace DataAccess.Services;

public interface IUserRepository
    : IBaseRepositorySearchable<UserAddEditModel, string, UserListItem, UserSearchModel, UserListComplex>
{
    Task<LoginResultModel> ValidateLogin(LoginModel model);
    Task<LoginResultModel> RegisterAsync(RegisterModel model);
    Task<bool> IsMobileTakenForRoleAsync(string mobile, string role);
    Task<(bool Success, string? UserId, string Message)> EnsureCustomerForGuestCheckoutAsync(
        string mobile, string? firstName, string? lastName, string? address, string? password);
    Task<LoginResultModel> EnsureCustomerAfterPaymentAsync(
        string mobile, string? firstName, string? lastName, string? address, string? postalCode);
    Task<LoginResultModel?> GetCustomerLoginResultByUserIdAsync(string userId);
}
