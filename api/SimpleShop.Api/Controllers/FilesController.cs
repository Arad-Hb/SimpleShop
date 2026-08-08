using System.Security.Claims;
using DomainModel.Models;
using DomainModel.Services;
using DomainModel.ViewModels.File;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilesController(SimpleShopDbContext db, MediaStorageService media) : ControllerBase
{
    [HttpPost("upload")]
    [Authorize]
    [RequestSizeLimit(2 * 1024 * 1024)]
    public async Task<ActionResult<FileUploadResult>> Upload(
        IFormFile file,
        [FromForm] string? folder = UploadFolders.Categories,
        CancellationToken cancellationToken = default)
    {
        if (!CanUploadToFolder(folder))
            return Forbid();

        var validation = ValidateRequest(file, folder);
        if (!validation.IsValid)
            return BadRequest(new FileUploadResult { Message = validation.Message });

        await using var stream = file!.OpenReadStream();
        var fileManager = await media.SaveUploadedFileAsync(
            stream,
            file.FileName,
            folder!,
            cancellationToken: cancellationToken);

        db.FileManagers.Add(fileManager);
        await db.SaveChangesAsync(cancellationToken);

        return Ok(ToUploadResult(fileManager, "فایل با موفقیت آپلود شد."));
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<FileMetadataResult>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var fileManager = await db.FileManagers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return fileManager == null ? NotFound() : Ok(ToMetadata(fileManager));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    [RequestSizeLimit(2 * 1024 * 1024)]
    public async Task<ActionResult<FileUploadResult>> Replace(
        int id,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new FileUploadResult { Message = "فایل انتخاب نشده است." });

        var validation = MediaStorageService.ValidateUpload(file.FileName, file.ContentType, file.Length);
        if (!validation.IsValid)
            return BadRequest(new FileUploadResult { Message = validation.Message });

        var fileManager = await db.FileManagers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (fileManager == null)
            return NotFound();

        await using var stream = file.OpenReadStream();
        await media.ReplaceUploadedFileAsync(fileManager, stream, file.FileName, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return Ok(ToUploadResult(fileManager, "فایل با موفقیت ویرایش شد."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var fileManager = await db.FileManagers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (fileManager == null)
            return NotFound();

        if (await IsFileReferencedAsync(id, cancellationToken))
            return Conflict(new { message = "این فایل در حال استفاده است و قابل حذف نیست." });

        media.RemoveFromDisk(fileManager.Url, fileManager.ThumbnailUrl);
        db.FileManagers.Remove(fileManager);
        await db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private bool CanUploadToFolder(string? folder)
    {
        if (User.IsInRole(Roles.Admin))
            return UploadFolders.IsAllowed(folder);

        return string.Equals(folder, UploadFolders.Users, StringComparison.OrdinalIgnoreCase)
               && (User.IsInRole(Roles.Customer) || User.IsInRole(Roles.Supplier));
    }

    private static UploadValidationResult ValidateRequest(IFormFile? file, string? folder)
    {
        if (!UploadFolders.IsAllowed(folder))
            return UploadValidationResult.Fail("پوشه آپلود نامعتبر است.");

        return MediaStorageService.ValidateUpload(
            file?.FileName,
            file?.ContentType,
            file?.Length ?? 0);
    }

    private async Task<bool> IsFileReferencedAsync(int fileId, CancellationToken cancellationToken)
    {
        if (await db.Categories.AnyAsync(c => c.ImageFileId == fileId || c.OgImageId == fileId, cancellationToken))
            return true;

        if (await db.Products.AnyAsync(p => p.PrimaryImageId == fileId || p.OgImageId == fileId, cancellationToken))
            return true;

        if (await db.ProductImages.AnyAsync(pi => pi.FileManagerId == fileId, cancellationToken))
            return true;

        if (await db.Banners.AnyAsync(b => b.FileManagerId == fileId, cancellationToken))
            return true;

        if (await db.Users.AnyAsync(u => u.AvatarFileId == fileId, cancellationToken))
            return true;

        if (await db.ShopSettings.AnyAsync(s =>
                s.LogoFileId == fileId || s.FaviconFileId == fileId || s.OgImageFileId == fileId, cancellationToken))
            return true;

        return false;
    }

    private static FileUploadResult ToUploadResult(FileManager fileManager, string message) => new()
    {
        Success = true,
        Message = message,
        Id = fileManager.Id,
        Url = fileManager.Url,
        ThumbnailUrl = fileManager.ThumbnailUrl
    };

    private static FileMetadataResult ToMetadata(FileManager fileManager) => new()
    {
        Id = fileManager.Id,
        FileName = fileManager.FileName,
        OriginalFileName = fileManager.OriginalFileName,
        Url = fileManager.Url,
        ThumbnailUrl = fileManager.ThumbnailUrl,
        MimeType = fileManager.MimeType,
        SizeBytes = fileManager.SizeBytes,
        AltText = fileManager.AltText,
        Folder = fileManager.Folder,
        CreatedAt = fileManager.CreatedAt
    };
}
