using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Account;

public class LoginModel
{
    [Required(ErrorMessage = "شماره موبایل الزامی است.")]
    public string MobileNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "رمز عبور الزامی است.")]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; }
}
