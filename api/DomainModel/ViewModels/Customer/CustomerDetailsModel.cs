namespace DomainModel.ViewModels.Customer;

public class CustomerDetailsModel
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? PostalCode { get; set; }
    public string? AvatarPath { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreateDate { get; set; }
    public int OrderCount { get; set; }
}
