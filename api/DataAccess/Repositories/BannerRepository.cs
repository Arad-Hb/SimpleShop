using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Banner;
using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

public class BannerRepository(SimpleShopDbContext db) : IBannerRepository
{
    private static BannerListItem ToListItem(Banner b) => new()
    {
        Id = b.Id,
        Title = b.Title,
        Subtitle = b.Subtitle,
        ButtonText = b.ButtonText,
        LinkUrl = b.LinkUrl,
        Placement = b.Placement,
        SortOrder = b.SortOrder,
        IsActive = b.IsActive,
        ImageUrl = b.FileManager?.Url ?? string.Empty,
        ThumbnailUrl = b.FileManager?.ThumbnailUrl ?? string.Empty,
        FileManagerId = b.FileManagerId
    };

    public async Task<List<BannerListItem>> GetActive(string? placement = null)
    {
        var now = DateTime.UtcNow;
        var query = db.Banners.AsNoTracking()
            .Include(b => b.FileManager)
            .Where(b => b.IsActive)
            .Where(b => b.StartsAt == null || b.StartsAt <= now)
            .Where(b => b.EndsAt == null || b.EndsAt >= now);

        if (!string.IsNullOrWhiteSpace(placement))
            query = query.Where(b => b.Placement == placement);

        return await query
            .OrderBy(b => b.Placement)
            .ThenBy(b => b.SortOrder)
            .Select(b => new BannerListItem
            {
                Id = b.Id,
                Title = b.Title,
                Subtitle = b.Subtitle,
                ButtonText = b.ButtonText,
                LinkUrl = b.LinkUrl,
                Placement = b.Placement,
                SortOrder = b.SortOrder,
                IsActive = b.IsActive,
                ImageUrl = b.FileManager.Url,
                ThumbnailUrl = b.FileManager.ThumbnailUrl,
                FileManagerId = b.FileManagerId
            })
            .ToListAsync();
    }

    public async Task<List<BannerListItem>> GetAll(string? placement = null)
    {
        var query = db.Banners.AsNoTracking().Include(b => b.FileManager).AsQueryable();
        if (!string.IsNullOrWhiteSpace(placement))
            query = query.Where(b => b.Placement == placement);

        var items = await query
            .OrderBy(b => b.Placement)
            .ThenBy(b => b.SortOrder)
            .ToListAsync();

        return items.Select(ToListItem).ToList();
    }

    public async Task<BannerAddEditModel?> Get(int id)
    {
        var entity = await db.Banners.AsNoTracking()
            .Include(b => b.FileManager)
            .FirstOrDefaultAsync(b => b.Id == id);
        if (entity == null) return null;

        return new BannerAddEditModel
        {
            Id = entity.Id,
            Title = entity.Title,
            Subtitle = entity.Subtitle,
            ButtonText = entity.ButtonText,
            LinkUrl = entity.LinkUrl,
            Placement = entity.Placement,
            SortOrder = entity.SortOrder,
            IsActive = entity.IsActive,
            FileManagerId = entity.FileManagerId
        };
    }

    public async Task<OperationResult> Add(BannerAddEditModel model)
    {
        var op = new OperationResult("Add Banner");
        if (!await db.FileManagers.AnyAsync(f => f.Id == model.FileManagerId))
            return op.ToFailed("فایل بنر پیدا نشد");

        var entity = new Banner
        {
            Title = model.Title.Trim(),
            Subtitle = string.IsNullOrWhiteSpace(model.Subtitle) ? null : model.Subtitle.Trim(),
            ButtonText = string.IsNullOrWhiteSpace(model.ButtonText) ? null : model.ButtonText.Trim(),
            LinkUrl = string.IsNullOrWhiteSpace(model.LinkUrl) ? null : model.LinkUrl.Trim(),
            Placement = model.Placement,
            SortOrder = model.SortOrder,
            IsActive = model.IsActive,
            FileManagerId = model.FileManagerId,
            CreatedAt = DateTime.UtcNow
        };

        db.Banners.Add(entity);
        await db.SaveChangesAsync();
        return op.ToSuccess("بنر اضافه شد", entity.Id);
    }

    public async Task<OperationResult> Update(BannerAddEditModel model)
    {
        var op = new OperationResult("Update Banner");
        var entity = await db.Banners.FirstOrDefaultAsync(b => b.Id == model.Id);
        if (entity == null)
            return op.ToFailed("بنر پیدا نشد");

        if (!await db.FileManagers.AnyAsync(f => f.Id == model.FileManagerId))
            return op.ToFailed("فایل بنر پیدا نشد");

        entity.Title = model.Title.Trim();
        entity.Subtitle = string.IsNullOrWhiteSpace(model.Subtitle) ? null : model.Subtitle.Trim();
        entity.ButtonText = string.IsNullOrWhiteSpace(model.ButtonText) ? null : model.ButtonText.Trim();
        entity.LinkUrl = string.IsNullOrWhiteSpace(model.LinkUrl) ? null : model.LinkUrl.Trim();
        entity.Placement = model.Placement;
        entity.SortOrder = model.SortOrder;
        entity.IsActive = model.IsActive;
        entity.FileManagerId = model.FileManagerId;

        await db.SaveChangesAsync();
        return op.ToSuccess("بنر ویرایش شد", entity.Id);
    }

    public async Task<OperationResult> Delete(int id)
    {
        var op = new OperationResult("Delete Banner");
        var entity = await db.Banners.FirstOrDefaultAsync(b => b.Id == id);
        if (entity == null)
            return op.ToFailed("بنر پیدا نشد");

        db.Banners.Remove(entity);
        await db.SaveChangesAsync();
        return op.ToSuccess("بنر حذف شد", id);
    }
}
