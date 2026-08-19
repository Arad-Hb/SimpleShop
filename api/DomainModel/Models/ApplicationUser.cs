using Microsoft.AspNetCore.Identity;

namespace DomainModel.Models;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? PostalCode { get; set; }
    public string? AvatarPath { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreateDate { get; set; } = DateTime.Now;

    public ICollection<Order> Orders { get; set; } = new List<Order>();

    public string DisplayName =>
        string.IsNullOrWhiteSpace($"{FirstName} {LastName}".Trim())
            ? UserName ?? string.Empty
            : $"{FirstName} {LastName}".Trim();
}
