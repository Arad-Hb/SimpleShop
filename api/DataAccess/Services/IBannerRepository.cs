using DomainModel.ViewModels.Banner;

namespace DataAccess.Services;

public interface IBannerRepository
{
    Task<List<BannerListItem>> GetActive(string? placement = null);
}
