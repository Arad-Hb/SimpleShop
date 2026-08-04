using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Category;
using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repositories;

public class CategoryRepository(SimpleShopDbContext db) : ICategoryRepository
{
    private static CategoryAddEditModel ToViewModel(Category c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        Slug = c.Slug,
        MetaTitle = c.MetaTitle,
        MetaDescription = c.MetaDescription,
        ImageFileId = c.ImageFileId
    };

    private static IQueryable<CategoryListItem> Project(IQueryable<Category> query) =>
        query.Select(c => new CategoryListItem
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            ProductCount = c.Products.Count,
            Slug = c.Slug,
            MetaTitle = c.MetaTitle,
            MetaDescription = c.MetaDescription,
            ImageUrl = c.ImageFile != null ? c.ImageFile.Url : null,
            ThumbnailUrl = c.ImageFile != null ? c.ImageFile.ThumbnailUrl : null
        });

    public async Task<OperationResult> Add(CategoryAddEditModel model)
    {
        var op = new OperationResult("Add Category");
        try
        {
            var entity = new Category
            {
                Name = model.Name,
                Description = model.Description,
                Slug = model.Slug,
                MetaTitle = model.MetaTitle,
                MetaDescription = model.MetaDescription,
                ImageFileId = model.ImageFileId
            };
            db.Categories.Add(entity);
            await db.SaveChangesAsync();
            return op.ToSuccess("دسته‌بندی اضافه شد", entity.Id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> Update(CategoryAddEditModel model)
    {
        var op = new OperationResult("Update Category");
        try
        {
            var entity = await db.Categories.FirstOrDefaultAsync(x => x.Id == model.Id);
            if (entity == null) return op.ToFailed("دسته پیدا نشد");
            entity.Name = model.Name;
            entity.Description = model.Description;
            entity.Slug = model.Slug;
            entity.MetaTitle = model.MetaTitle;
            entity.MetaDescription = model.MetaDescription;
            entity.ImageFileId = model.ImageFileId;
            await db.SaveChangesAsync();
            return op.ToSuccess("دسته‌بندی ویرایش شد", entity.Id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<OperationResult> Delete(int id)
    {
        var op = new OperationResult("Delete Category");
        try
        {
            var entity = await db.Categories.Include(c => c.Products).FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null) return op.ToFailed("دسته پیدا نشد");
            if (entity.Products.Count > 0) return op.ToFailed("دسته دارای محصول است و قابل حذف نیست");
            db.Categories.Remove(entity);
            await db.SaveChangesAsync();
            return op.ToSuccess("دسته‌بندی حذف شد", id);
        }
        catch (Exception ex)
        {
            return op.ToFailed(ex.Message);
        }
    }

    public async Task<CategoryAddEditModel?> Get(int id)
    {
        var entity = await db.Categories.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return entity == null ? null : ToViewModel(entity);
    }

    public async Task<List<CategoryListItem>> GetAll()
    {
        return await Project(db.Categories.AsNoTracking()).OrderBy(c => c.Name).ToListAsync();
    }

    public async Task<CategoryListComplex> Search(CategorySearchModel searchModel)
    {
        if (searchModel.PageSize <= 0) searchModel.PageSize = 20;
        searchModel.PageIndex = Math.Max(0, searchModel.PageIndex);

        var query = db.Categories.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(searchModel.Search))
        {
            var term = searchModel.Search.Trim();
            query = query.Where(c => c.Name.Contains(term));
        }

        var result = new CategoryListComplex { SearchModel = searchModel };
        result.SearchModel.RecordCount = await query.CountAsync();
        result.Items = await Project(query.OrderBy(c => c.Name)
                .Skip(searchModel.PageIndex * searchModel.PageSize)
                .Take(searchModel.PageSize))
            .ToListAsync();
        return result;
    }
}
