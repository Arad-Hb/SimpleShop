using System.ComponentModel.DataAnnotations;
using DomainModel.Models;

namespace DomainModel.ViewModels.User;

public class RegisterModel
{
    /// <summary>Iranian mobile e.g. 09121234567</summary>
    [Required(ErrorMessage = "شماره موبایل الزامی است")]
    [StringLength(15, MinimumLength = 10)]
    public string Mobile { get; set; } = string.Empty;

    [Required(ErrorMessage = "رمز عبور الزامی است")]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;

    /// <summary>Customer or Supplier only.</summary>
    [Required]
    public string Role { get; set; } = Roles.Customer;

    [StringLength(100)]
    public string? FirstName { get; set; }

    [StringLength(100)]
    public string? LastName { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    [StringLength(20)]
    public string? PostalCode { get; set; }
}
