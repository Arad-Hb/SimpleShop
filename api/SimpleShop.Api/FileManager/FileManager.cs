using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.Versioning;

namespace SimpleShop.Api.FileManager;

public class FileManager(IWebHostEnvironment environment, IConfiguration configuration) : IFileManager
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp"
    };

    private long MaxFileSizeBytes =>
        configuration.GetValue<long?>("FileManager:MaxImageSizeBytes") ?? 5 * 1024 * 1024;

    public Task<FileManagerResult> SaveProductImageAsync(IFormFile file)
        => SaveImageAsync(file, "images/products/originals", "images/products/thumbnails", createThumbnail: true);

    public Task<FileManagerResult> SaveCategoryImageAsync(IFormFile file)
        => SaveImageAsync(file, "images/categories/originals", "images/categories/thumbnails", createThumbnail: true);

    public Task<FileManagerResult> SaveAvatarAsync(IFormFile file)
        => SaveImageAsync(file, "images/users/avatars", null, createThumbnail: false);

    public Task<FileManagerResult> SaveSiteImageAsync(IFormFile file)
        => SaveImageAsync(file, "images/site", null, createThumbnail: false);

    public Task<FileManagerResult> SaveHeroImageAsync(IFormFile file)
        => SaveImageAsync(file, "images/hero", null, createThumbnail: false);

    private async Task<FileManagerResult> SaveImageAsync(
        IFormFile file,
        string folder,
        string? thumbnailFolder,
        bool createThumbnail)
    {
        var validationMessage = Validate(file);
        if (validationMessage is not null)
        {
            return new FileManagerResult
            {
                Success = false,
                Message = validationMessage
            };
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var root = environment.WebRootPath
            ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var physicalFolder = Path.Combine(root, folder.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(physicalFolder);

        var originalPhysicalPath = Path.Combine(physicalFolder, fileName);
        string? thumbnailPhysicalPath = null;

        try
        {
            await using (var stream = new FileStream(originalPhysicalPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                await file.CopyToAsync(stream);

            string? thumbnailWebPath = null;
            if (createThumbnail && thumbnailFolder is not null)
            {
                var thumbnailPhysicalFolder = Path.Combine(root, thumbnailFolder.Replace('/', Path.DirectorySeparatorChar));
                Directory.CreateDirectory(thumbnailPhysicalFolder);
                thumbnailPhysicalPath = Path.Combine(thumbnailPhysicalFolder, fileName);
                CreateThumbnail(originalPhysicalPath, thumbnailPhysicalPath, extension);
                thumbnailWebPath = $"/{thumbnailFolder}/{fileName}";
            }

            return new FileManagerResult
            {
                Success = true,
                Message = "فایل با موفقیت ذخیره شد.",
                FileName = fileName,
                FilePath = $"/{folder}/{fileName}",
                ThumbnailPath = thumbnailWebPath
            };
        }
        catch
        {
            SafeDelete(originalPhysicalPath);
            SafeDelete(thumbnailPhysicalPath);
            return new FileManagerResult { Success = false, Message = "ذخیره فایل انجام نشد." };
        }
    }

    [SupportedOSPlatform("windows")]
    private static void CreateThumbnail(string sourcePath, string destinationPath, string extension)
    {
        if (!OperatingSystem.IsWindows() || extension.Equals(".webp", StringComparison.OrdinalIgnoreCase))
        {
            File.Copy(sourcePath, destinationPath, overwrite: false);
            return;
        }

        using var sourceImage = Image.FromFile(sourcePath);
        const int maxWidth = 480;
        const int maxHeight = 360;
        var ratio = Math.Min((double)maxWidth / sourceImage.Width, (double)maxHeight / sourceImage.Height);
        ratio = Math.Min(ratio, 1d);
        var width = Math.Max(1, (int)Math.Round(sourceImage.Width * ratio));
        var height = Math.Max(1, (int)Math.Round(sourceImage.Height * ratio));

        using var thumbnail = new Bitmap(width, height);
        using (var graphics = Graphics.FromImage(thumbnail))
        {
            graphics.CompositingQuality = CompositingQuality.HighQuality;
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.SmoothingMode = SmoothingMode.HighQuality;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            graphics.DrawImage(sourceImage, 0, 0, width, height);
        }

        var imageFormat = extension.Equals(".png", StringComparison.OrdinalIgnoreCase)
            ? ImageFormat.Png
            : ImageFormat.Jpeg;
        thumbnail.Save(destinationPath, imageFormat);
    }

    public Task<bool> DeleteFileAsync(string? webPath)
    {
        if (string.IsNullOrWhiteSpace(webPath))
            return Task.FromResult(true);

        try
        {
            var root = Path.GetFullPath(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"));
            var relative = webPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.GetFullPath(Path.Combine(root, relative));
            var rootWithSeparator = root.EndsWith(Path.DirectorySeparatorChar) ? root : root + Path.DirectorySeparatorChar;
            if (!fullPath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(fullPath, root, StringComparison.OrdinalIgnoreCase))
                return Task.FromResult(false);

            if (File.Exists(fullPath))
                File.Delete(fullPath);

            return Task.FromResult(true);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    private string? Validate(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return "فایل تصویر انتخاب نشده است.";
        if (file.Length > MaxFileSizeBytes)
            return "حجم تصویر بیشتر از حد مجاز است.";
        if (!AllowedExtensions.Contains(Path.GetExtension(file.FileName)))
            return "فرمت تصویر مجاز نیست. فقط JPG، JPEG، PNG و WebP قابل قبول است.";
        if (!AllowedContentTypes.Contains(file.ContentType))
            return "نوع محتوای تصویر معتبر نیست.";
        return null;
    }

    private static void SafeDelete(string? physicalPath)
    {
        if (string.IsNullOrWhiteSpace(physicalPath))
            return;
        try
        {
            if (File.Exists(physicalPath))
                File.Delete(physicalPath);
        }
        catch
        {
            // Best-effort cleanup after a failed upload.
        }
    }
}
