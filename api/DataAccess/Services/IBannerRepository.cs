using DomainModel.ViewModels.Banner;
using Framework.Common;

namespace DataAccess.Services;

public interface IBannerRepository
{
    Task<List<BannerListItem>> GetActive(string? placement = null);
    Task<List<BannerListItem>> GetAll(string? placement = null);
    Task<BannerAddEditModel?> Get(int id);
    Task<OperationResult> Add(BannerAddEditModel model);
    Task<OperationResult> Update(BannerAddEditModel model);
    Task<OperationResult> Delete(int id);
}
