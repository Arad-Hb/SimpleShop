using DataAccess.Services.Account;
using DataAccess.Services.Categories;
using DataAccess.Services.Products;
using DataAccess.Services.ShopSettings;
using Framework.Common;
using Framework.Common.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimpleShop.Api.Extensions;
using SimpleShop.Api.FileManager;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/file-manager")]
public class FileManagerController(
    IFileManager fileManager,
    IProductService products,
    ICategoryService categories,
    IShopSettingService settings,
    IAccountService accounts) : ControllerBase
{
    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("products/{id:int}/image")]
    public async Task<IActionResult> ProductImage(int id, IFormFile file)
    {
        var existing = await products.GetImagePathsAsync(id);
        if (existing is null)
            return NotFound(new OperationResult("تصویر محصول").ToFailed("محصول پیدا نشد."));

        var saved = await fileManager.SaveProductImageAsync(file);
        if (!saved.Success)
            return BadRequest(new OperationResult("تصویر محصول").ToFailed(saved.Message));

        var result = await products.UpdateImageAsync(id, saved.FilePath!, saved.ThumbnailPath);
        if (!result.Success)
            return BadRequest(result);

        await fileManager.DeleteFileAsync(existing.Value.ImagePath);
        await fileManager.DeleteFileAsync(existing.Value.ThumbnailPath);
        return Ok(result);
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("categories/{id:int}/image")]
    public async Task<IActionResult> CategoryImage(int id, IFormFile file)
    {
        var existing = await categories.GetImagePathsAsync(id);
        if (existing is null)
            return NotFound(new OperationResult("تصویر دسته‌بندی").ToFailed("دسته‌بندی پیدا نشد."));

        var saved = await fileManager.SaveCategoryImageAsync(file);
        if (!saved.Success)
            return BadRequest(new OperationResult("تصویر دسته‌بندی").ToFailed(saved.Message));

        var result = await categories.UpdateImageAsync(id, saved.FilePath!, saved.ThumbnailPath);
        if (!result.Success)
            return BadRequest(result);

        await fileManager.DeleteFileAsync(existing.Value.ImagePath);
        await fileManager.DeleteFileAsync(existing.Value.ThumbnailPath);
        return Ok(result);
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("site/logo")]
    public Task<IActionResult> Logo(IFormFile file)
        => ReplaceSiteImage(file, settings.GetLogoPathAsync, settings.UpdateLogoAsync, fileManager.SaveSiteImageAsync, "لوگو");

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("site/favicon")]
    public Task<IActionResult> Favicon(IFormFile file)
        => ReplaceSiteImage(file, settings.GetFaviconPathAsync, settings.UpdateFaviconAsync, fileManager.SaveSiteImageAsync, "فاوآیکون");

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("site/hero")]
    public Task<IActionResult> Hero(IFormFile file)
        => ReplaceSiteImage(file, settings.GetHeroImagePathAsync, settings.UpdateHeroImageAsync, fileManager.SaveHeroImageAsync, "تصویر اصلی");

    [HttpPost("account/avatar")]
    public async Task<IActionResult> Avatar(IFormFile file)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized();

        var previous = await accounts.GetAvatarPathAsync(userId);
        var saved = await fileManager.SaveAvatarAsync(file);
        if (!saved.Success)
            return BadRequest(new OperationResult("تصویر کاربر").ToFailed(saved.Message));

        var result = await accounts.UpdateAvatarPathAsync(userId, saved.FilePath!);
        if (!result.Success)
            return BadRequest(result);

        await fileManager.DeleteFileAsync(previous);
        return Ok(result);
    }

    private async Task<IActionResult> ReplaceSiteImage(
        IFormFile file,
        Func<Task<string?>> getPrevious,
        Func<string, Task<OperationResult>> update,
        Func<IFormFile, Task<FileManagerResult>> save,
        string title)
    {
        var saved = await save(file);
        if (!saved.Success)
            return BadRequest(new OperationResult(title).ToFailed(saved.Message));

        var previous = await getPrevious();
        var result = await update(saved.FilePath!);
        if (!result.Success)
            return BadRequest(result);

        await fileManager.DeleteFileAsync(previous);
        return Ok(result);
    }
}
