using Framework.Common;

namespace Framework.Services;

public interface IBaseRepository<TModel, TKey, TListItem>
{
    Task<OperationResult> Add(TModel model);
    Task<OperationResult> Delete(TKey id);
    Task<OperationResult> Update(TModel model);
    Task<TModel?> Get(TKey id);
}
