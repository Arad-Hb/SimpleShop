using Framework.Common.Helpers;

namespace SimpleShop.Tests;

public class MobileHelperTests
{
    [Theory]
    [InlineData("09123456789", "09123456789")]
    [InlineData("9123456789", "09123456789")]
    [InlineData("۰۹۱۲۳۴۵۶۷۸۹", "09123456789")]
    [InlineData("989123456789", "09123456789")]
    public void Normalize_ValidMobiles(string input, string expected)
        => Assert.Equal(expected, MobileHelper.Normalize(input));

    [Theory]
    [InlineData("123")]
    [InlineData("")]
    [InlineData(null)]
    public void Normalize_InvalidMobiles(string? input)
        => Assert.Null(MobileHelper.Normalize(input));
}
