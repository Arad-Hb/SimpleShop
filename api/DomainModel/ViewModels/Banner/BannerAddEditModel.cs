using System.ComponentModel.DataAnnotations;
using DomainModel.Models;

namespace DomainModel.ViewModels.Banner;

public class BannerAddEditModel
{
    public int Id { get; set; }

    [Required, StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Subtitle { get; set; }

    [StringLength(100)]
    public string? ButtonText { get; set; }

    [StringLength(500)]
    public string? LinkUrl { get; set; }

    [Required, StringLength(50)]
    public string Placement { get; set; } = BannerPlacements.HeroSlider;

    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    [Required]
    public int FileManagerId { get; set; }
}
