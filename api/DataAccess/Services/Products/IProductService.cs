using DomainModel.ViewModels.Product;
using Framework.Common;

namespace DataAccess.Services.Products;

public interface IProductService
{
    Task<ProductListComplex> SearchPublicAsync(ProductSearchModel model);
    Task<ProductListComplex> SearchAdminAsync(ProductSearchModel model);
    Task<ProductDetailsModel?> GetDetailsAsync(int id, bool publicOnly = true);
    Task<ProductDetailsModel?> GetBySlugAsync(string slug);
    Task<List<ProductListItem>> GetLatestAsync(int take = 8);
    Task<OperationResult> AddAsync(ProductAddEditModel model);
    Task<OperationResult> UpdateAsync(int id, ProductAddEditModel model);
    Task<OperationResult> DeleteAsync(int id);
    Task<OperationResult> UpdateImageAsync(int id, string imagePath, string? thumbnailPath);
    Task<(string? ImagePath, string? ThumbnailPath)?> GetImagePathsAsync(int id);
}
