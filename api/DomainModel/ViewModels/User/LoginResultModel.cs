namespace DomainModel.ViewModels.User;

public class LoginResultModel
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    /// <summary>Display username — mobile for shoppers/suppliers, "admin" for admin.</summary>
    public string Username { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
