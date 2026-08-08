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

    public int? AvatarFileId { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    [StringLength(20)]
    public string? PostalCode { get; set; }

    [StringLength(10)]
    public string? NationalId { get; set; }
}
