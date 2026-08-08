namespace DomainModel.ViewModels.File;

public class FileUploadResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
}
