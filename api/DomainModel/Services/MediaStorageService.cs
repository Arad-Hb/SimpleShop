using DomainModel.Models;
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

    public MediaStorageService(string webRootPath, HttpClient? httpClient = null)
    {
        _webRootPath = string.IsNullOrWhiteSpace(webRootPath)
            ? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")
            : webRootPath;
        _http = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(45) };
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("SimpleShopSeeder/1.0");
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

        // Normalize to JPEG for consistent thumbnails
        await using (var ms = new MemoryStream(bytes))
        using (var image = await Image.LoadAsync(ms, cancellationToken))
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

    private static string SanitizeFolder(string folder)
    {
        var clean = string.Join("-", (folder ?? "general")
            .Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries))
            .Trim()
            .ToLowerInvariant();
        return string.IsNullOrWhiteSpace(clean) ? "general" : clean;
    }
}
