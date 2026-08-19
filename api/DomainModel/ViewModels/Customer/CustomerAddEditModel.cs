using System.ComponentModel.DataAnnotations;

namespace DomainModel.ViewModels.Customer;

public class CustomerAddEditModel
{
    [Required(ErrorMessage = "نام الزامی است.")]
    [StringLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "نام خانوادگی الزامی است.")]
    [StringLength(80)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "شماره موبایل الزامی است.")]
    [StringLength(15)]
    public string MobileNumber { get; set; } = string.Empty;

    [StringLength(400)]
    public string? Address { get; set; }

    [StringLength(20)]
    public string? PostalCode { get; set; }

    public bool IsActive { get; set; } = true;

    [MinLength(6, ErrorMessage = "رمز عبور حداقل ۶ کاراکتر است.")]
    public string? Password { get; set; }
}
