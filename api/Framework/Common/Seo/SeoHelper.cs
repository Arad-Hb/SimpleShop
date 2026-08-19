using System.Text.RegularExpressions;

namespace Framework.Common.Seo;

public static partial class SeoHelper
{
    public static string? ToSlug(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var normalized = value.Trim().ToLowerInvariant()
            .Replace('ي', 'ی')
            .Replace('ك', 'ک');

        normalized = InvalidSlugCharacters().Replace(normalized, "-");
        normalized = MultipleDashes().Replace(normalized, "-").Trim('-');
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    public static string? BuildDefaultDescription(string? text, int maxLength = 160)
    {
        if (string.IsNullOrWhiteSpace(text))
            return null;

        var compact = Regex.Replace(text.Trim(), @"\s+", " ");
        return compact.Length <= maxLength ? compact : compact[..maxLength].TrimEnd();
    }

    [GeneratedRegex(@"[^\p{L}\p{Nd}]+", RegexOptions.Compiled)]
    private static partial Regex InvalidSlugCharacters();

    [GeneratedRegex("-+", RegexOptions.Compiled)]
    private static partial Regex MultipleDashes();
}
