namespace DomainModel.Models;

public static class BannerPlacements
{
    public const string HeroSlider = "HeroSlider";
    public const string SideAd = "SideAd";
    public const string AdRow = "AdRow";
}

public class Banner
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? ButtonText { get; set; }
    public string? LinkUrl { get; set; }
    /// <summary>HeroSlider | SideAd | AdRow</summary>
    public string Placement { get; set; } = BannerPlacements.HeroSlider;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public int FileManagerId { get; set; }
    public FileManager FileManager { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
