using Framework.Common;

namespace DataAccess.Services.Common;

public interface IPaginationService
{
    Task<List<T>> PaginateAsync<T>(IQueryable<T> query, PageModel pageModel, CancellationToken cancellationToken = default);
}
