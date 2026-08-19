using Framework.Common;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Services.Common;

public class PaginationService : IPaginationService
{
    public async Task<List<T>> PaginateAsync<T>(
        IQueryable<T> query,
        PageModel pageModel,
        CancellationToken cancellationToken = default)
    {
        if (pageModel.PageIndex <= 0)
            pageModel.PageIndex = 1;

        if (pageModel.PageSize > 50)
            pageModel.PageSize = 50;

        pageModel.RecordCount = await query.CountAsync(cancellationToken);

        if (pageModel.PageCount > 0 && pageModel.PageIndex > pageModel.PageCount)
            pageModel.PageIndex = pageModel.PageCount;

        return await query
            .Skip((pageModel.PageIndex - 1) * pageModel.PageSize)
            .Take(pageModel.PageSize)
            .ToListAsync(cancellationToken);
    }
}
