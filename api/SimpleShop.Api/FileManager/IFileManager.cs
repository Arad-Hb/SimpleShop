namespace SimpleShop.Api.FileManager;

public interface IFileManager
{
    Task<FileManagerResult> SaveProductImageAsync(IFormFile file);
    Task<FileManagerResult> SaveCategoryImageAsync(IFormFile file);
    Task<FileManagerResult> SaveAvatarAsync(IFormFile file);
    Task<FileManagerResult> SaveSiteImageAsync(IFormFile file);
    Task<FileManagerResult> SaveHeroImageAsync(IFormFile file);
    Task<bool> DeleteFileAsync(string? webPath);
}

public class FileManagerResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public string? ThumbnailPath { get; set; }
}
