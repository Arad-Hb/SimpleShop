using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Account;

public class RegisterModel
{
    [Required(ErrorMessage = "نام الزامی است.")]
    [StringLength(50, ErrorMessage = "نام حداکثر ۵۰ کاراکتر است.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "نام خانوادگی الزامی است.")]
    [StringLength(80, ErrorMessage = "نام خانوادگی حداکثر ۸۰ کاراکتر است.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "شماره موبایل الزامی است.")]
    [StringLength(15, ErrorMessage = "شماره موبایل معتبر نیست.")]
    public string MobileNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "رمز عبور الزامی است.")]
    [MinLength(6, ErrorMessage = "رمز عبور حداقل ۶ کاراکتر است.")]
    public string Password { get; set; } = string.Empty;
}
