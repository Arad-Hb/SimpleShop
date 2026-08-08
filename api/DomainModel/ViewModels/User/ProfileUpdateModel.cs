using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.User;

public class ProfileUpdateModel
{
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;

    [EmailAddress, StringLength(100)]
    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }
}
