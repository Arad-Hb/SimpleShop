using DomainModel.ViewModels.Category;
using Framework.Common;

namespace DataAccess.Services.Categories;

public interface ICategoryService
{
    Task<List<CategoryMenuItem>> GetMenuAsync();
    Task<CategoryDetailsModel?> GetDetailsAsync(int id);
    Task<CategoryDetailsModel?> GetBySlugAsync(string slug);
    Task<CategoryListComplex> SearchAsync(CategorySearchModel model);
    Task<OperationResult> AddAsync(CategoryAddEditModel model);
    Task<OperationResult> UpdateAsync(int id, CategoryAddEditModel model);
    Task<OperationResult> DeleteAsync(int id);
    Task<OperationResult> UpdateImageAsync(int id, string imagePath, string? thumbnailPath);
    Task<(string? ImagePath, string? ThumbnailPath)?> GetImagePathsAsync(int id);
}
