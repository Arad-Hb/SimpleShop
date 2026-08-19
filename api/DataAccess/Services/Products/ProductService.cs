using DataAccess.Repositories.Categories;
using DataAccess.Repositories.Products;
using DataAccess.Services.Common;
using DomainModel.ViewModels.Product;
using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Services.Products;

public class ProductService(
    IProductRepository repository,
    ICategoryRepository categoryRepository,
    IPaginationService pagination) : IProductService
{
    public Task<ProductListComplex> SearchPublicAsync(ProductSearchModel model)
        => SearchAsync(model, publicOnly: true);

    public Task<ProductListComplex> SearchAdminAsync(ProductSearchModel model)
        => SearchAsync(model, publicOnly: false);

    public async Task<ProductDetailsModel?> GetDetailsAsync(int id, bool publicOnly = true)
    {
        var entity = await repository.GetByIdAsync(id, tracking: false);
        if (entity is null)
            return null;
        if (publicOnly && (!entity.IsActive || entity.Category is null || !entity.Category.IsActive))
            return null;
        return ProductMapper.ToDetails(entity);
    }

    public async Task<ProductDetailsModel?> GetBySlugAsync(string slug)
    {
        var entity = await repository.GetBySlugAsync(slug);
        if (entity is null || !entity.IsActive || entity.Category is null || !entity.Category.IsActive)
            return null;
        return ProductMapper.ToDetails(entity);
    }

    public async Task<List<ProductListItem>> GetLatestAsync(int take = 8)
    {
        var items = await repository.Query()
            .Include(x => x.Category)
            .Where(x => x.IsActive && x.Category.IsActive)
            .OrderByDescending(x => x.CreateDate)
            .Take(take)
            .ToListAsync();

        return items.Select(ProductMapper.ToListItem).ToList();
    }

    public async Task<OperationResult> AddAsync(ProductAddEditModel model)
    {
        var result = new OperationResult("افزودن محصول");
        var categoryError = await ValidateChildCategoryAsync(model.CategoryId);
        if (categoryError is not null)
            return result.ToFailed(categoryError);

        var entity = ProductMapper.ToEntity(model);
        entity.Slug = await EnsureUniqueSlugAsync(model.ResolvedSlug, null);
        await repository.AddAsync(entity);
        await repository.SaveChangesAsync();
        return result.ToSuccess("محصول با موفقیت اضافه شد.", entity.Id);
    }

    public async Task<OperationResult> UpdateAsync(int id, ProductAddEditModel model)
    {
        var result = new OperationResult("ویرایش محصول");
        var entity = await repository.GetByIdAsync(id);
        if (entity is null)
            return result.ToFailed("محصول پیدا نشد.");

        var categoryError = await ValidateChildCategoryAsync(model.CategoryId);
        if (categoryError is not null)
            return result.ToFailed(categoryError);

        ProductMapper.MapForUpdate(model, entity);
        entity.Slug = await EnsureUniqueSlugAsync(model.ResolvedSlug, id);
        await repository.SaveChangesAsync();
        return result.ToSuccess("محصول با موفقیت ویرایش شد.", entity.Id);
    }

    public async Task<OperationResult> DeleteAsync(int id)
    {
        var result = new OperationResult("حذف محصول");
        var entity = await repository.GetByIdAsync(id);
        if (entity is null)
            return result.ToFailed("محصول پیدا نشد.");

        if (await repository.HasOrderItemsAsync(id))
            return result.ToFailed("این محصول در سفارش‌ها استفاده شده و قابل حذف نیست.");

        repository.Remove(entity);
        await repository.SaveChangesAsync();
        return result.ToSuccess("محصول حذف شد.", id);
    }

    public async Task<OperationResult> UpdateImageAsync(int id, string imagePath, string? thumbnailPath)
    {
        var result = new OperationResult("تصویر محصول");
        var entity = await repository.GetByIdAsync(id);
        if (entity is null)
            return result.ToFailed("محصول پیدا نشد.");

        entity.ImagePath = imagePath;
        entity.ThumbnailPath = thumbnailPath;
        entity.UpdateDate = DateTime.Now;
        await repository.SaveChangesAsync();
        return result.ToSuccess("تصویر محصول ذخیره شد.", id);
    }

    public async Task<(string? ImagePath, string? ThumbnailPath)?> GetImagePathsAsync(int id)
    {
        var entity = await repository.GetByIdAsync(id, tracking: false);
        return entity is null ? null : (entity.ImagePath, entity.ThumbnailPath);
    }

    private async Task<ProductListComplex> SearchAsync(ProductSearchModel model, bool publicOnly)
    {
        var query = repository.Query().Include(x => x.Category).AsQueryable();

        if (publicOnly)
            query = query.Where(x => x.IsActive && x.Category.IsActive);

        if (!string.IsNullOrWhiteSpace(model.Term))
        {
            var term = model.Term.Trim();
            query = query.Where(x =>
                x.Name.Contains(term) ||
                (x.BrandName != null && x.BrandName.Contains(term)) ||
                (x.Slug != null && x.Slug.Contains(term)));
        }

        if (model.CategoryId.HasValue)
        {
            var categoryId = model.CategoryId.Value;
            query = query.Where(x =>
                x.CategoryId == categoryId || x.Category.ParentId == categoryId);
        }

        if (model.IsActive.HasValue && !publicOnly)
            query = query.Where(x => x.IsActive == model.IsActive);

        if (model.MinPrice.HasValue)
            query = query.Where(x => x.Price >= model.MinPrice);

        if (model.MaxPrice.HasValue)
            query = query.Where(x => x.Price <= model.MaxPrice);

        if (model.InStock == true)
            query = query.Where(x => x.Stock > 0);

        query = model.Sort switch
        {
            "price-asc" => query.OrderBy(x => x.Price),
            "price-desc" => query.OrderByDescending(x => x.Price),
            "name" => query.OrderBy(x => x.Name),
            _ => query.OrderByDescending(x => x.CreateDate)
        };

        var rows = await pagination.PaginateAsync(query, model);
        return new ProductListComplex
        {
            Items = rows.Select(ProductMapper.ToListItem).ToList(),
            Page = model
        };
    }

    private async Task<string?> ValidateChildCategoryAsync(int categoryId)
    {
        var category = await categoryRepository.GetByIdAsync(categoryId, tracking: false);
        if (category is null)
            return "دسته‌بندی پیدا نشد.";
        if (!category.IsActive)
            return "دسته‌بندی انتخاب‌شده غیرفعال است.";
        if (category.ParentId is null)
            return "محصول باید در یک دسته سطح دوم قرار بگیرد.";
        return null;
    }

    private async Task<string> EnsureUniqueSlugAsync(string slug, int? excludeId)
    {
        var baseSlug = string.IsNullOrWhiteSpace(slug) ? "product" : slug;
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
