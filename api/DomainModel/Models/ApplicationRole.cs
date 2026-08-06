using Microsoft.AspNetCore.Identity;

namespace DomainModel.Models;

public class ApplicationRole : IdentityRole
{
    public string? Description { get; set; }
    public ICollection<ApplicationUserRole> ApplicationUserRoles { get; set; } = new List<ApplicationUserRole>();
}
