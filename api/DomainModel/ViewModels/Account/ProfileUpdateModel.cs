using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Account;

public class ProfileUpdateModel
{
    [Required(ErrorMessage = "نام الزامی است.")]
    [StringLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "نام خانوادگی الزامی است.")]
    [StringLength(80)]
    public string LastName { get; set; } = string.Empty;

    [StringLength(400)]
    public string? Address { get; set; }

    [StringLength(20)]
    public string? PostalCode { get; set; }
}
