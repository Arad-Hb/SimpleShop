using Framework.Common.Seo;

namespace SimpleShop.Tests;

public class SeoHelperTests
{
    [Fact]
    public void ToSlug_PersianAndEnglish()
    {
        Assert.Equal("hello-world", SeoHelper.ToSlug("Hello World"));
        Assert.Equal("لپ-تاپ", SeoHelper.ToSlug("لپ تاپ"));
    }

    [Fact]
    public void BuildDefaultDescription_Truncates()
    {
        var text = new string('a', 200);
        var result = SeoHelper.BuildDefaultDescription(text, 160);
        Assert.Equal(160, result!.Length);
    }
}
