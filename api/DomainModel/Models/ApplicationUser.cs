using Microsoft.AspNetCore.Identity;

namespace DomainModel.Models;

public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Address { get; set; }
    public string? PostalCode { get; set; }
    public string? NationalId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime RegisterDate { get; set; } = DateTime.UtcNow;

    public ICollection<ApplicationUserRole> ApplicationUserRoles { get; set; } = new List<ApplicationUserRole>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();

    public string DisplayName =>
        string.IsNullOrWhiteSpace($"{FirstName} {LastName}".Trim())
            ? UserName ?? Email ?? string.Empty
            : $"{FirstName} {LastName}".Trim();
}
