using DomainModel.ViewModels.User;
using Framework.Services;

namespace DataAccess.Services;

public interface IUserRepository
    : IBaseRepositorySearchable<UserAddEditModel, int, UserListItem, UserSearchModel, UserListComplex>
{
    Task<LoginResultModel> ValidateLogin(LoginModel model);
}
