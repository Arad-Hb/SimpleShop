using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Banner;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

public class BannerRepository(SimpleShopDbContext db) : IBannerRepository
{
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
                ThumbnailUrl = b.FileManager.ThumbnailUrl
            })
            .ToListAsync();
    }
}
