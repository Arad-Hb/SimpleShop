namespace DomainModel.Models;

public static class IdentityUserNames
{
    private const string CustomerPrefix = "Customer";
    private const string SupplierPrefix = "Supplier";

    public static string NormalizeMobile(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        var digits = new string(input.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("98") && digits.Length == 12)
            digits = "0" + digits[2..];
        if (digits.Length == 10 && digits.StartsWith('9'))
            digits = "0" + digits;

        return digits.Length == 11 && digits.StartsWith("09") ? digits : string.Empty;
    }

    public static bool IsValidMobile(string? input)
        => !string.IsNullOrEmpty(NormalizeMobile(input));

    /// <summary>Identity-safe username: Customer09121234567 (letters + digits only).</summary>
    public static string BuildUserName(string role, string mobileOrUsername)
    {
        if (string.Equals(mobileOrUsername, "admin", StringComparison.OrdinalIgnoreCase))
            return "admin";

        var roleName = string.IsNullOrWhiteSpace(role) ? Roles.Customer : role.Trim();
        var mobile = NormalizeMobile(mobileOrUsername);
        if (string.IsNullOrEmpty(mobile))
            throw new ArgumentException("شماره موبایل نامعتبر است.", nameof(mobileOrUsername));

        var prefix = roleName switch
        {
            Roles.Supplier => SupplierPrefix,
            Roles.Customer => CustomerPrefix,
            _ => roleName
        };

        return $"{prefix}{mobile}";
    }

    public static string ResolveLoginUserName(string username, string? role)
    {
        var input = username.Trim();
        if (string.Equals(input, "admin", StringComparison.OrdinalIgnoreCase))
            return "admin";

        var roleName = string.IsNullOrWhiteSpace(role) ? Roles.Customer : role.Trim();
        return BuildUserName(roleName, input);
    }

    public static string ToDisplayMobile(ApplicationUser user)
    {
        if (string.IsNullOrWhiteSpace(user.UserName))
            return user.PhoneNumber ?? string.Empty;

        if (string.Equals(user.UserName, "admin", StringComparison.OrdinalIgnoreCase))
            return user.UserName;

        var normalized = NormalizeMobile(user.PhoneNumber);
        if (!string.IsNullOrEmpty(normalized))
            return normalized;

        var userName = user.UserName;
        if (userName.StartsWith(CustomerPrefix, StringComparison.OrdinalIgnoreCase))
            return userName[CustomerPrefix.Length..];
        if (userName.StartsWith(SupplierPrefix, StringComparison.OrdinalIgnoreCase))
            return userName[SupplierPrefix.Length..];

        return userName;
    }
}
