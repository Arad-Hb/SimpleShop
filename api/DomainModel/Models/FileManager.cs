namespace DomainModel.Models;

/// <summary>Shared media library — originals + generated thumbnails under wwwroot/uploads.</summary>
public class FileManager
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    /// <summary>Public relative URL, e.g. /uploads/products/abc.jpg</summary>
    public string Url { get; set; } = string.Empty;
    /// <summary>Public relative thumbnail URL, e.g. /uploads/products/thumbs/abc.jpg</summary>
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string MimeType { get; set; } = "image/jpeg";
    public long SizeBytes { get; set; }
    public string? AltText { get; set; }
    /// <summary>Remote URL used when seeding / importing.</summary>
    public string? SourceUrl { get; set; }
    /// <summary>Logical folder: products, banners, categories, seo</summary>
    public string Folder { get; set; } = "general";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
