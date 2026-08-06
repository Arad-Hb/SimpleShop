using System.ComponentModel.DataAnnotations;
using DomainModel.Models;

namespace DomainModel.ViewModels.User;

public class LoginModel
{
    /// <summary>Mobile number for Customer/Supplier, or "admin" for Admin panel.</summary>
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    /// <summary>Panel role: Admin, Customer, or Supplier.</summary>
    [Required]
    public string Role { get; set; } = Roles.Customer;
}
