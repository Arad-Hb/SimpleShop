using System.Text.RegularExpressions;

namespace Framework.Common.Helpers;

public static partial class MobileHelper
{
    public static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var digits = PersianDigits().Replace(value.Trim(), match => match.Value switch
        {
            "۰" or "٠" => "0",
            "۱" or "١" => "1",
            "۲" or "٢" => "2",
            "۳" or "٣" => "3",
            "۴" or "٤" => "4",
            "۵" or "٥" => "5",
            "۶" or "٦" => "6",
            "۷" or "٧" => "7",
            "۸" or "٨" => "8",
            "۹" or "٩" => "9",
            _ => match.Value
        });

        digits = NonDigits().Replace(digits, string.Empty);

        if (digits.StartsWith("0098", StringComparison.Ordinal))
            digits = "0" + digits[4..];
        else if (digits.StartsWith("98", StringComparison.Ordinal) && digits.Length == 12)
            digits = "0" + digits[2..];
        else if (digits.StartsWith("9", StringComparison.Ordinal) && digits.Length == 10)
            digits = "0" + digits;

        return IsValid(digits) ? digits : null;
    }

    public static bool IsValid(string? value)
        => !string.IsNullOrWhiteSpace(value) && IranianMobile().IsMatch(value);

    [GeneratedRegex("[۰-۹٠-٩]")]
    private static partial Regex PersianDigits();

    [GeneratedRegex(@"\D")]
    private static partial Regex NonDigits();

    [GeneratedRegex(@"^09\d{9}$")]
    private static partial Regex IranianMobile();
}
