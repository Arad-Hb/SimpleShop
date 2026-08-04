namespace Framework.Services;

public interface IBaseRepositorySearchable<TModel, TKey, TListItem, TSearchModel, TComplexModel>
    : IBaseRepository<TModel, TKey, TListItem>
{
    Task<TComplexModel> Search(TSearchModel searchModel);
}
