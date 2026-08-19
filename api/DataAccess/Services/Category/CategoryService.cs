using DataAccess.Repositories.Categories;
using DataAccess.Services.Common;
using DomainModel.ViewModels.Category;
using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Services.Categories;

public class CategoryService(
    ICategoryRepository repository,
    IPaginationService pagination) : ICategoryService
{
    public async Task<List<CategoryMenuItem>> GetMenuAsync()
    {
        var roots = await repository.Query()
            .Where(x => x.ParentId == null && x.IsActive)
            .Include(x => x.Children)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ToListAsync();

        return roots.Select(CategoryMapper.ToMenuItem).ToList();
    }

    public async Task<CategoryDetailsModel?> GetDetailsAsync(int id)
    {
        var entity = await repository.Query()
            .Include(x => x.Parent)
            .Include(x => x.Children)
            .Include(x => x.Products)
            .FirstOrDefaultAsync(x => x.Id == id);

        return entity is null ? null : CategoryMapper.ToDetails(entity);
    }

    public async Task<CategoryDetailsModel?> GetBySlugAsync(string slug)
    {
        var entity = await repository.GetBySlugAsync(slug);
        return entity is null ? null : CategoryMapper.ToDetails(entity);
    }

    public async Task<CategoryListComplex> SearchAsync(CategorySearchModel model)
    {
        var query = repository.Query()
            .Include(x => x.Parent)
            .Include(x => x.Products)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(model.Term))
        {
            var term = model.Term.Trim();
            query = query.Where(x => x.Name.Contains(term) || (x.Slug != null && x.Slug.Contains(term)));
        }

        if (model.ParentId.HasValue)
            query = query.Where(x => x.ParentId == model.ParentId);

        if (model.IsActive.HasValue)
            query = query.Where(x => x.IsActive == model.IsActive);

        query = query.OrderBy(x => x.ParentId.HasValue).ThenBy(x => x.SortOrder).ThenBy(x => x.Name);
        var rows = await pagination.PaginateAsync(query, model);
        return new CategoryListComplex
        {
            Items = rows.Select(CategoryMapper.ToListItem).ToList(),
            Page = model
        };
    }

    public async Task<OperationResult> AddAsync(CategoryAddEditModel model)
    {
        var result = new OperationResult("افزودن دسته‌بندی");
        var parentError = await ValidateParentAsync(model.ParentId);
        if (parentError is not null)
            return result.ToFailed(parentError);

        var slug = await EnsureUniqueSlugAsync(model.ResolvedSlug, null);
        var entity = CategoryMapper.ToEntity(model);
        entity.Slug = slug;
        await repository.AddAsync(entity);
        await repository.SaveChangesAsync();
        return result.ToSuccess("دسته‌بندی با موفقیت اضافه شد.", entity.Id);
    }

    public async Task<OperationResult> UpdateAsync(int id, CategoryAddEditModel model)
    {
        var result = new OperationResult("ویرایش دسته‌بندی");
        var entity = await repository.GetByIdAsync(id);
        if (entity is null)
            return result.ToFailed("دسته‌بندی پیدا نشد.");

        if (model.ParentId == id)
            return result.ToFailed("دسته‌بندی نمی‌تواند والد خودش باشد.");

        var parentError = await ValidateParentAsync(model.ParentId, id);
        if (parentError is not null)
            return result.ToFailed(parentError);

        if (model.ParentId is not null && await repository.HasChildrenAsync(id))
            return result.ToFailed("دسته‌بندی دارای زیرمجموعه است و نمی‌تواند خودش زیرمجموعه شود.");

        CategoryMapper.MapForUpdate(model, entity);
        entity.Slug = await EnsureUniqueSlugAsync(model.ResolvedSlug, id);
        await repository.SaveChangesAsync();
        return result.ToSuccess("دسته‌بندی با موفقیت ویرایش شد.", entity.Id);
    }

    public async Task<OperationResult> DeleteAsync(int id)
    {
        var result = new OperationResult("حذف دسته‌بندی");
        var entity = await repository.GetByIdAsync(id);
        if (entity is null)
            return result.ToFailed("دسته‌بندی پیدا نشد.");

        if (await repository.HasChildrenAsync(id))
            return result.ToFailed("ابتدا زیرمجموعه‌های این دسته را حذف کنید.");

        if (await repository.HasProductsAsync(id))
            return result.ToFailed("این دسته دارای محصول است و قابل حذف نیست.");

        repository.Remove(entity);
        await repository.SaveChangesAsync();
        return result.ToSuccess("دسته‌بندی حذف شد.", id);
    }

    public async Task<OperationResult> UpdateImageAsync(int id, string imagePath, string? thumbnailPath)
    {
        var result = new OperationResult("تصویر دسته‌بندی");
        var entity = await repository.GetByIdAsync(id);
        if (entity is null)
            return result.ToFailed("دسته‌بندی پیدا نشد.");

        entity.ImagePath = imagePath;
        entity.ThumbnailPath = thumbnailPath;
        entity.UpdateDate = DateTime.Now;
        await repository.SaveChangesAsync();
        return result.ToSuccess("تصویر دسته‌بندی ذخیره شد.", id);
    }

    public async Task<(string? ImagePath, string? ThumbnailPath)?> GetImagePathsAsync(int id)
    {
        var entity = await repository.GetByIdAsync(id, tracking: false);
        return entity is null ? null : (entity.ImagePath, entity.ThumbnailPath);
    }

    private async Task<string?> ValidateParentAsync(int? parentId, int? currentId = null)
    {
        if (parentId is null)
            return null;

        var parent = await repository.GetByIdAsync(parentId.Value, tracking: false);
        if (parent is null)
            return "دسته‌بندی والد پیدا نشد.";

        if (parent.ParentId is not null)
            return "فقط دو سطح دسته‌بندی مجاز است. والد باید دسته اصلی باشد.";

        if (currentId.HasValue && parent.Id == currentId.Value)
            return "دسته‌بندی نمی‌تواند والد خودش باشد.";

        return null;
    }

    private async Task<string> EnsureUniqueSlugAsync(string slug, int? excludeId)
    {
        var baseSlug = string.IsNullOrWhiteSpace(slug) ? "category" : slug;
        var candidate = baseSlug;
        var index = 2;
        while (await repository.SlugExistsAsync(candidate, excludeId))
        {
            candidate = $"{baseSlug}-{index}";
            index++;
        }

        return candidate;
    }
}
