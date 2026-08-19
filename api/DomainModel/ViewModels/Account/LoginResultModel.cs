namespace DomainModel.ViewModels.Account;

public class LoginResultModel
{
    public string Token { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
    public string UserID { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? AvatarPath { get; set; }
    public List<string> Roles { get; set; } = [];
}
