using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Account;

public class ChangePasswordModel
{
    [Required(ErrorMessage = "رمز عبور فعلی الزامی است.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "رمز عبور جدید الزامی است.")]
    [MinLength(6, ErrorMessage = "رمز عبور جدید حداقل ۶ کاراکتر است.")]
    public string NewPassword { get; set; } = string.Empty;
}
