using DomainModel.Models;
using DomainModel.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilesController(SimpleShopDbContext db, MediaStorageService media) : ControllerBase
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp"
    };

    [HttpPost("upload")]
    [Authorize(Roles = Roles.Admin)]
    [RequestSizeLimit(2 * 1024 * 1024)]
    public async Task<ActionResult<FileUploadResult>> Upload(
        IFormFile file,
        [FromForm] string? folder = "categories",
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "فایل انتخاب نشده است." });

        if (!AllowedContentTypes.Contains(file.ContentType))
            return BadRequest(new { message = "فرمت تصویر مجاز نیست. (JPG, PNG, WebP)" });

        await using var stream = file.OpenReadStream();
        var fileManager = await media.SaveUploadedFileAsync(
            stream,
            file.FileName,
            folder ?? "categories",
            cancellationToken: cancellationToken);

        db.FileManagers.Add(fileManager);
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new FileUploadResult
        {
            Id = fileManager.Id,
            Url = fileManager.Url,
            ThumbnailUrl = fileManager.ThumbnailUrl
        });
    }
}

public class FileUploadResult
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
}
