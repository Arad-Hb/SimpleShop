using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.User;

public class UserAddEditModel
{
    public string Id { get; set; } = string.Empty;

    [Required, StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [EmailAddress, StringLength(100)]
    public string Email { get; set; } = string.Empty;

    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;

    [StringLength(20)]
    public string Role { get; set; } = "Customer";

    public string? Password { get; set; }

    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? PostalCode { get; set; }
    public string? NationalId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? RegisterDate { get; set; }
}
