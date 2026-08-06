namespace DomainModel.Models;

public class ApplicationUserRole
{
    public string ApplicationUserID { get; set; } = string.Empty;
    public string ApplicationRoleID { get; set; } = string.Empty;
    public ApplicationRole ApplicationRole { get; set; } = null!;
    public ApplicationUser ApplicationUser { get; set; } = null!;
}
