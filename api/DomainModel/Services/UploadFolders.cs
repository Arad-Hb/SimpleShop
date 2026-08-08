namespace DomainModel.Services;

public static class UploadFolders
{
    public const string Categories = "categories";
    public const string Products = "products";
    public const string Users = "users";
    public const string Banners = "banners";
    public const string Settings = "settings";

    private static readonly HashSet<string> Allowed = new(StringComparer.OrdinalIgnoreCase)
    {
        Categories, Products, Users, Banners, Settings
    };

    public static bool IsAllowed(string? folder) =>
        !string.IsNullOrWhiteSpace(folder) && Allowed.Contains(folder.Trim());
}
