namespace DomainModel.ViewModels.User;

public class UserListItem
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? NationalId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime RegisterDate { get; set; }
    public int OrderCount { get; set; }
    public bool HasOrders { get; set; }
    public decimal TotalPurchase { get; set; }
}
