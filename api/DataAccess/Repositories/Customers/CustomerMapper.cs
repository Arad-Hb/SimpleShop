using DomainModel.Models;
using DomainModel.ViewModels.Customer;
using Framework.Common.Extensions;

namespace DataAccess.Repositories.Customers;

public static class CustomerMapper
{
    public static CustomerListItem ToListItem(ApplicationUser user, int orderCount)
        => new()
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            DisplayName = user.DisplayName,
            MobileNumber = user.PhoneNumber ?? user.UserName ?? string.Empty,
            IsActive = user.IsActive,
            CreateDate = user.CreateDate,
            CreateDatePersian = user.CreateDate.ToPersianDate(),
            OrderCount = orderCount
        };

    public static CustomerDetailsModel ToDetails(ApplicationUser user, int orderCount)
        => new()
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            MobileNumber = user.PhoneNumber ?? user.UserName ?? string.Empty,
            Address = user.Address,
            PostalCode = user.PostalCode,
            AvatarPath = user.AvatarPath,
            IsActive = user.IsActive,
            CreateDate = user.CreateDate,
            OrderCount = orderCount
        };
}
