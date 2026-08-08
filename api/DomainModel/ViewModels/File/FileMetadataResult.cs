namespace DomainModel.ViewModels.File;

public class FileMetadataResult
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string? AltText { get; set; }
    public string Folder { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
