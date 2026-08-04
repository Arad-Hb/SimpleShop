namespace DomainModel.ViewModels.User;

public class UserListComplex
{
    public List<UserListItem> Items { get; set; } = new();
    public UserSearchModel SearchModel { get; set; } = new();
}
