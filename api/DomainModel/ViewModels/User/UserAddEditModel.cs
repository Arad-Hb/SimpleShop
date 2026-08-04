using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.User;

public class UserAddEditModel
{
    public int Id { get; set; }

    [Required, StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(100)]
    public string Email { get; set; } = string.Empty;

    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [StringLength(20)]
    public string Role { get; set; } = "Customer";

    /// <summary>Only for create / password change. Never returned from Get.</summary>
    public string? Password { get; set; }

    public string? Phone { get; set; }
    public string? Address { get; set; }
}
