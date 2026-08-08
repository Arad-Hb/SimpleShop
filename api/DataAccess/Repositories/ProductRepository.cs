using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Product;
using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

/// <summary>
/// Product data access — one class, direct EF Core queries (no extra service layer).
/// Flow: Controller → ProductRepository → SimpleShopDbContext → SQL Server
/// </summary>
public class ProductRepository(SimpleShopDbContext db) : IProductRepository
{
    private Product ToDbModel(ProductAddEditModel model) => new()
    {
        Name = model.Name,
        Description = model.Description,
        Price = model.Price,
        Stock = model.Stock,
        IsActive = model.IsActive,
        MinimumStock = model.MinimumStock,
        CategoryId = model.CategoryId,
        SupplierId = model.SupplierId,
        Slug = model.Slug,
        MetaTitle = model.MetaTitle,
        MetaDescription = model.MetaDescription,
        MetaKeywords = model.MetaKeywords,
        CanonicalUrl = model.CanonicalUrl,
        OgTitle = model.OgTitle,
        OgDescription = model.OgDescription,
        PrimaryImageId = model.PrimaryImageId,
        OgImageId = model.OgImageId,
        CreatedAt = DateTime.UtcNow
    };

    private static ProductAddEditModel ToViewModel(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        Price = p.Price,
        Stock = p.Stock,
        IsActive = p.IsActive,
        MinimumStock = p.MinimumStock,
        CategoryId = p.CategoryId,
        SupplierId = p.SupplierId,
        Slug = p.Slug,
        MetaTitle = p.MetaTitle,
        MetaDescription = p.MetaDescription,
        MetaKeywords = p.MetaKeywords,
        CanonicalUrl = p.CanonicalUrl,
        OgTitle = p.OgTitle,
        OgDescription = p.OgDescription,
        PrimaryImageId = p.PrimaryImageId,
        OgImageId = p.OgImageId
    };

    private static IQueryable<ProductListItem> ProjectList(IQueryable<Product> query) =>
        query.Select(p => new ProductListItem
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            Price = p.Price,
            Stock = p.Stock,
            IsActive = p.IsActive,
            MinimumStock = p.MinimumStock,
            HasOrders = p.OrderItems.Any(),
            CreatedAt = p.CreatedAt,
            CategoryId = p.CategoryId,
            CategoryName = p.Category.Name,
            SupplierId = p.SupplierId,
            SupplierName = p.Supplier != null ? p.Supplier.Name : null,
            Slug = p.Slug,
            MetaTitle = p.MetaTitle,
            MetaDescription = p.MetaDescription,
            MetaKeywords = p.MetaKeywords,
            CanonicalUrl = p.CanonicalUrl,
            OgTitle = p.OgTitle,
            OgDescription = p.OgDescription,
            ImageUrl = p.PrimaryImage != null ? p.PrimaryImage.Url : null,
            ThumbnailUrl = p.PrimaryImage != null ? p.PrimaryImage.ThumbnailUrl : null,
            OgImageUrl = p.OgImage != null ? p.OgImage.Url : (p.PrimaryImage != null ? p.PrimaryImage.Url : null),
            PrimaryImageId = p.PrimaryImageId,
            OgImageId = p.OgImageId
        });

    public async Task<OperationResult> Add(ProductAddEditModel model)
    {
        var op = new OperationResult("Add Product");
        try
        {
            var entity = ToDbModel(model);
            db.Products.Add(entity);
            await db.SaveChangesAsync();
            return op.ToSuccess("محصول با موفقیت اضافه شد", entity.Id);
        }
        catch (Exception ex)
        {
            return op.ToFailed("خطا در ثبت محصول: " + ex.Message);
        }
    }

    public async Task<OperationResult> Update(ProductAddEditModel model)
    {
        var op = new OperationResult("Update Product");
        if (model.Id <= 0)
            return op.ToFailed("شناسه نامعتبر است");

        try
        {
            var entity = await db.Products.FirstOrDefaultAsync(x => x.Id == model.Id);
            if (entity == null)
                return op.ToFailed("محصول پیدا نشد");

            entity.Name = model.Name;
            entity.Description = model.Description;
            entity.Price = model.Price;
            entity.Stock = model.Stock;
            entity.IsActive = model.IsActive;
            entity.MinimumStock = model.MinimumStock;
            entity.CategoryId = model.CategoryId;
            entity.SupplierId = model.SupplierId;
            entity.Slug = model.Slug;
            entity.MetaTitle = model.MetaTitle;
            entity.MetaDescription = model.MetaDescription;
            entity.MetaKeywords = model.MetaKeywords;
            entity.CanonicalUrl = model.CanonicalUrl;
            entity.OgTitle = model.OgTitle;
            entity.OgDescription = model.OgDescription;
            entity.PrimaryImageId = model.PrimaryImageId;
            entity.OgImageId = model.OgImageId;
            await db.SaveChangesAsync();
            return op.ToSuccess("محصول با موفقیت ویرایش شد", entity.Id);
        }
        catch (Exception ex)
        {
            return op.ToFailed("خطا در ویرایش محصول: " + ex.Message);
        }
    }

    public async Task<OperationResult> Delete(int id)
    {
        var op = new OperationResult("Delete Product");
        try
        {
            var entity = await db.Products.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
                return op.ToFailed("محصول پیدا نشد");

            if (await db.OrderItems.AnyAsync(x => x.ProductId == id))
                return op.ToFailed("این محصول در سفارش‌ها استفاده شده و قابل حذف نیست.");

            var tracked = await db.Products.FirstOrDefaultAsync(x => x.Id == id);
            if (tracked == null)
                return op.ToFailed("محصول پیدا نشد");

            db.Products.Remove(tracked);
            await db.SaveChangesAsync();
            return op.ToSuccess("محصول حذف شد", id);
        }
        catch (Exception ex)
        {
            return op.ToFailed("خطا در حذف محصول: " + ex.Message);
        }
    }

    public async Task<ProductAddEditModel?> Get(int id)
    {
        var entity = await db.Products.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return entity == null ? null : ToViewModel(entity);
    }

    public async Task<ProductListItem?> GetListItem(int id)
    {
        var item = await ProjectList(
                db.Products.AsNoTracking()
                    .Include(p => p.Category)
                    .Include(p => p.Supplier)
                    .Include(p => p.PrimaryImage)
                    .Include(p => p.OgImage)
                    .Where(p => p.Id == id))
            .FirstOrDefaultAsync();

        if (item == null) return null;

        item.Gallery = await db.ProductImages.AsNoTracking()
            .Where(pi => pi.ProductId == id)
            .OrderBy(pi => pi.SortOrder)
            .Select(pi => new ProductImageItem
            {
                Id = pi.Id,
                FileManagerId = pi.FileManagerId,
                Url = pi.FileManager.Url,
                ThumbnailUrl = pi.FileManager.ThumbnailUrl,
                AltText = pi.AltText,
                IsPrimary = pi.IsPrimary,
                SortOrder = pi.SortOrder
            })
            .ToListAsync();

        return item;
    }

    public async Task<OperationResult> AddProductImage(int productId, ProductImageAddModel model)
    {
        var op = new OperationResult("Add Product Image");
        try
        {
            var productExists = await db.Products.AnyAsync(p => p.Id == productId);
            if (!productExists)
                return op.ToFailed("محصول پیدا نشد");

            var fileExists = await db.FileManagers.AnyAsync(f => f.Id == model.FileManagerId);
            if (!fileExists)
                return op.ToFailed("فایل تصویر پیدا نشد");

            if (model.IsPrimary)
            {
                var existingPrimary = await db.ProductImages
                    .Where(pi => pi.ProductId == productId && pi.IsPrimary)
                    .ToListAsync();
                foreach (var img in existingPrimary)
                    img.IsPrimary = false;

                var product = await db.Products.FirstAsync(p => p.Id == productId);
                product.PrimaryImageId = model.FileManagerId;
            }

            var entity = new ProductImage
            {
                ProductId = productId,
                FileManagerId = model.FileManagerId,
                AltText = model.AltText,
                IsPrimary = model.IsPrimary,
                SortOrder = model.SortOrder
            };

            db.ProductImages.Add(entity);
            await db.SaveChangesAsync();
            return op.ToSuccess("تصویر به گالری اضافه شد", entity.Id);
        }
        catch (Exception ex)
        {
            return op.ToFailed("خطا در افزودن تصویر: " + ex.Message);
        }
    }

    public async Task<OperationResult> UpdateProductImage(int productId, int imageId, ProductImageUpdateModel model)
    {
        var op = new OperationResult("Update Product Image");
        try
        {
            var entity = await db.ProductImages
                .FirstOrDefaultAsync(pi => pi.Id == imageId && pi.ProductId == productId);
            if (entity == null)
                return op.ToFailed("تصویر پیدا نشد");

            if (model.AltText != null)
                entity.AltText = model.AltText;

            if (model.SortOrder.HasValue)
                entity.SortOrder = model.SortOrder.Value;

            if (model.IsPrimary == true)
            {
                var existingPrimary = await db.ProductImages
                    .Where(pi => pi.ProductId == productId && pi.IsPrimary && pi.Id != imageId)
                    .ToListAsync();
                foreach (var img in existingPrimary)
                    img.IsPrimary = false;

                entity.IsPrimary = true;
                var product = await db.Products.FirstAsync(p => p.Id == productId);
                product.PrimaryImageId = entity.FileManagerId;
            }
            else if (model.IsPrimary == false)
            {
                entity.IsPrimary = false;
            }

            await db.SaveChangesAsync();
            return op.ToSuccess("تصویر به‌روزرسانی شد", imageId);
        }
        catch (Exception ex)
        {
            return op.ToFailed("خطا در ویرایش تصویر: " + ex.Message);
        }
    }

    public async Task<OperationResult> RemoveProductImage(int productId, int imageId)
    {
        var op = new OperationResult("Remove Product Image");
        try
        {
            var entity = await db.ProductImages
                .FirstOrDefaultAsync(pi => pi.Id == imageId && pi.ProductId == productId);
            if (entity == null)
                return op.ToFailed("تصویر پیدا نشد");

            if (entity.IsPrimary)
            {
                var product = await db.Products.FirstOrDefaultAsync(p => p.Id == productId);
                if (product != null && product.PrimaryImageId == entity.FileManagerId)
                    product.PrimaryImageId = null;
            }

            db.ProductImages.Remove(entity);
            await db.SaveChangesAsync();
            return op.ToSuccess("تصویر از گالری حذف شد", imageId);
        }
        catch (Exception ex)
        {
            return op.ToFailed("خطا در حذف تصویر: " + ex.Message);
        }
    }

    public async Task<ProductListComplex> Search(ProductSearchModel searchModel)
    {
        searchModel.PageIndex = searchModel.PageIndex < 0 ? 0 : searchModel.PageIndex;
        if (searchModel.PageSize <= 0) searchModel.PageSize = 12;

        var query = db.Products.AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Include(p => p.PrimaryImage)
            .Include(p => p.OgImage)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchModel.Search))
        {
            var term = searchModel.Search.Trim();
            query = query.Where(p =>
                p.Name.Contains(term)
                || (p.Description != null && p.Description.Contains(term)));
        }

        if (searchModel.CategoryId is > 0)
            query = query.Where(p => p.CategoryId == searchModel.CategoryId);

        if (searchModel.SupplierId is > 0)
            query = query.Where(p => p.SupplierId == searchModel.SupplierId);

        if (searchModel.IsActive is not null)
            query = query.Where(p => p.IsActive == searchModel.IsActive);

        if (searchModel.MinPrice is >= 0)
            query = query.Where(p => p.Price >= searchModel.MinPrice);

        if (searchModel.MaxPrice is > 0)
            query = query.Where(p => p.Price <= searchModel.MaxPrice);

        query = (searchModel.SortBy?.ToLower(), searchModel.SortDir?.ToLower()) switch
        {
            ("price", "desc") => query.OrderByDescending(p => p.Price),
            ("price", _) => query.OrderBy(p => p.Price),
            ("stock", "desc") => query.OrderByDescending(p => p.Stock),
            ("stock", _) => query.OrderBy(p => p.Stock),
            (_, "desc") => query.OrderByDescending(p => p.Name),
            _ => query.OrderBy(p => p.Name)
        };

        var result = new ProductListComplex { SearchModel = searchModel };
        result.SearchModel.RecordCount = await query.CountAsync();
        result.Items = await ProjectList(query
                .Skip(searchModel.PageIndex * searchModel.PageSize)
                .Take(searchModel.PageSize))
            .ToListAsync();

        return result;
    }
}
