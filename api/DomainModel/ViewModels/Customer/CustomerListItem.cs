namespace DomainModel.ViewModels.Customer;

public class CustomerListItem
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreateDate { get; set; }
    public string CreateDatePersian { get; set; } = string.Empty;
    public int OrderCount { get; set; }
}
