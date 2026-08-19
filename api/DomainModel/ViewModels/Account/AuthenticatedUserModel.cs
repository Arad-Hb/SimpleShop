namespace DomainModel.ViewModels.Account;

public class AuthenticatedUserModel
{
    public string UserID { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? PostalCode { get; set; }
    public string? AvatarPath { get; set; }
    public List<string> Roles { get; set; } = [];
}
