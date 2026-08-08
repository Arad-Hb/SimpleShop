using DomainModel.Models;
using DomainModel.ViewModels.File;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace DomainModel.Services;

/// <summary>
/// Downloads remote images into wwwroot/uploads, generates thumbnails, returns FileManager rows (unsaved).
/// </summary>
public class MediaStorageService
{
    private readonly string _webRootPath;
    private readonly HttpClient _http;
    private const int ThumbSize = 320;

    public static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp"
    };

    public static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        "jpg", "jpeg", "png", "webp"
    };

    public const int DefaultMaxSizeMb = 2;

    public MediaStorageService(string webRootPath, HttpClient? httpClient = null)
    {
        _webRootPath = string.IsNullOrWhiteSpace(webRootPath)
            ? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")
            : webRootPath;
        _http = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(45) };
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("SimpleShopSeeder/1.0");
    }

    public static UploadValidationResult ValidateUpload(
        string? fileName,
        string? contentType,
        long length,
        int maxSizeMb = DefaultMaxSizeMb)
    {
        if (length <= 0)
            return UploadValidationResult.Fail("فایل انتخاب نشده است.");

        var extension = Path.GetExtension(fileName ?? string.Empty)
            .TrimStart('.')
            .ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
            return UploadValidationResult.Fail("فرمت تصویر مجاز نیست. (JPG, PNG, WebP)");

        if (string.IsNullOrWhiteSpace(contentType) || !AllowedContentTypes.Contains(contentType))
            return UploadValidationResult.Fail("فرمت تصویر مجاز نیست. (JPG, PNG, WebP)");

        long maxBytes = maxSizeMb * 1024L * 1024L;
        if (length > maxBytes)
            return UploadValidationResult.Fail("حجم فایل بیش از حد مجاز است.");

        return UploadValidationResult.Ok();
    }

    public async Task<FileManager> DownloadAndStoreAsync(
        string sourceUrl,
        string folder,
        string? altText = null,
        CancellationToken cancellationToken = default)
    {
        folder = SanitizeFolder(folder);
        var bytes = await _http.GetByteArrayAsync(sourceUrl, cancellationToken);

        var fileName = $"{Guid.NewGuid():N}.jpg";
        var relativeDir = Path.Combine("uploads", folder).Replace('\\', '/');
        var relativeThumbDir = Path.Combine("uploads", folder, "thumbs").Replace('\\', '/');

        var absDir = Path.Combine(_webRootPath, "uploads", folder);
        var absThumbDir = Path.Combine(absDir, "thumbs");
        Directory.CreateDirectory(absDir);
        Directory.CreateDirectory(absThumbDir);

        var absPath = Path.Combine(absDir, fileName);
        var absThumbPath = Path.Combine(absThumbDir, fileName);

        await using (var ms = new MemoryStream(bytes))
        using (var image = await Image.LoadAsync(ms, cancellationToken))
        {
            await SaveImageWithThumbnailAsync(image, absPath, absThumbPath, cancellationToken);
        }

        var size = new FileInfo(absPath).Length;
        var originalName = Path.GetFileName(new Uri(sourceUrl).AbsolutePath);
        if (string.IsNullOrWhiteSpace(originalName) || originalName == "/")
            originalName = fileName;

        return new FileManager
        {
            FileName = fileName,
            OriginalFileName = originalName,
            Url = $"/{relativeDir}/{fileName}",
            ThumbnailUrl = $"/{relativeThumbDir}/{fileName}",
            MimeType = "image/jpeg",
            SizeBytes = size,
            AltText = altText,
            SourceUrl = sourceUrl,
            Folder = folder,
            CreatedAt = DateTime.UtcNow
        };
    }

    public async Task<FileManager> SaveUploadedFileAsync(
        Stream stream,
        string originalFileName,
        string folder,
        string? altText = null,
        CancellationToken cancellationToken = default)
    {
        folder = SanitizeFolder(folder);
        var fileName = $"{Guid.NewGuid():N}.jpg";

        var relativeDir = Path.Combine("uploads", folder).Replace('\\', '/');
        var relativeThumbDir = Path.Combine("uploads", folder, "thumbs").Replace('\\', '/');

        var absDir = Path.Combine(_webRootPath, "uploads", folder);
        var absThumbDir = Path.Combine(absDir, "thumbs");
        Directory.CreateDirectory(absDir);
        Directory.CreateDirectory(absThumbDir);

        var absPath = Path.Combine(absDir, fileName);
        var absThumbPath = Path.Combine(absThumbDir, fileName);

        await using (stream)
        using (var image = await Image.LoadAsync(stream, cancellationToken))
        {
            await SaveImageWithThumbnailAsync(image, absPath, absThumbPath, cancellationToken);
        }

        var size = new FileInfo(absPath).Length;

        return new FileManager
        {
            FileName = fileName,
            OriginalFileName = string.IsNullOrWhiteSpace(originalFileName) ? fileName : originalFileName,
            Url = $"/{relativeDir}/{fileName}",
            ThumbnailUrl = $"/{relativeThumbDir}/{fileName}",
            MimeType = "image/jpeg",
            SizeBytes = size,
            AltText = altText,
            Folder = folder,
            CreatedAt = DateTime.UtcNow
        };
    }

    public async Task<FileManager> ReplaceUploadedFileAsync(
        FileManager existing,
        Stream stream,
        string originalFileName,
        CancellationToken cancellationToken = default)
    {
        var oldUrl = existing.Url;
        var oldThumbUrl = existing.ThumbnailUrl;

        var folder = SanitizeFolder(existing.Folder);
        var fileName = $"{Guid.NewGuid():N}.jpg";
        var relativeDir = Path.Combine("uploads", folder).Replace('\\', '/');
        var relativeThumbDir = Path.Combine("uploads", folder, "thumbs").Replace('\\', '/');

        var absDir = Path.Combine(_webRootPath, "uploads", folder);
        var absThumbDir = Path.Combine(absDir, "thumbs");
        Directory.CreateDirectory(absDir);
        Directory.CreateDirectory(absThumbDir);

        var absPath = Path.Combine(absDir, fileName);
        var absThumbPath = Path.Combine(absThumbDir, fileName);

        await using (stream)
        using (var image = await Image.LoadAsync(stream, cancellationToken))
        {
            await SaveImageWithThumbnailAsync(image, absPath, absThumbPath, cancellationToken);
        }

        existing.FileName = fileName;
        existing.OriginalFileName = string.IsNullOrWhiteSpace(originalFileName) ? fileName : originalFileName;
        existing.Url = $"/{relativeDir}/{fileName}";
        existing.ThumbnailUrl = $"/{relativeThumbDir}/{fileName}";
        existing.MimeType = "image/jpeg";
        existing.SizeBytes = new FileInfo(absPath).Length;

        RemoveFromDisk(oldUrl, oldThumbUrl);

        return existing;
    }

    public bool RemoveFromDisk(string url, string? thumbnailUrl)
    {
        DeleteIfExists(url);
        if (!string.IsNullOrWhiteSpace(thumbnailUrl))
            DeleteIfExists(thumbnailUrl);
        return true;
    }

    private void DeleteIfExists(string relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl)) return;

        var path = Path.Combine(_webRootPath, relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(path))
            File.Delete(path);
    }

    private static async Task SaveImageWithThumbnailAsync(
        Image image,
        string absPath,
        string absThumbPath,
        CancellationToken cancellationToken)
    {
        var encoder = new JpegEncoder { Quality = 85 };
        await image.SaveAsJpegAsync(absPath, encoder, cancellationToken);

        using var thumb = image.Clone(ctx =>
        {
            ctx.Resize(new ResizeOptions
            {
                Size = new Size(ThumbSize, ThumbSize),
                Mode = ResizeMode.Crop
            });
        });
        await thumb.SaveAsJpegAsync(absThumbPath, new JpegEncoder { Quality = 80 }, cancellationToken);
    }

    private static string SanitizeFolder(string folder)
    {
        var clean = string.Join("-", (folder ?? "general")
            .Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries))
            .Trim()
            .ToLowerInvariant();
        return string.IsNullOrWhiteSpace(clean) ? "general" : clean;
    }
}
