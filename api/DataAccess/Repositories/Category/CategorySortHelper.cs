using DomainModel.ViewModels.Category;
using CategoryEntity = DomainModel.Models.Category;

namespace DataAccess.Repositories.Categories;

internal static class CategorySortHelper
{
    public static int GetNextSortOrder(IReadOnlyList<CategoryEntity> siblings)
        => siblings.Count == 0 ? 1 : siblings.Max(s => s.SortOrder) + 1;

    public static CategorySortOrderConflictModel BuildConflict(int requested, int autoSortOrder)
        => new()
        {
            RequiresConfirmation = true,
            RequestedSortOrder = requested,
            AutoSortOrder = autoSortOrder,
            Message = requested == 1
                ? "این دسته به عنوان اولین مورد (SortOrder=1) قرار می‌گیرد و SortOrder سایر دسته‌های هم‌سطح یک واحد افزایش می‌یابد. تأیید می‌کنید؟"
                : $"قرار دادن در موقعیت {requested} باعث افزایش SortOrder سایر دسته‌های هم‌سطح می‌شود. تأیید می‌کنید؟"
        };

    /// <summary>
    /// Resolves SortOrder for create/insert-into-new-parent. Null or &lt;= 0 appends at the end.
    /// Same-parent UPDATE with a null SortOrder is handled in the repository (keep current).
    /// Same-parent UPDATE with &lt;= 0 still comes here and appends.
    /// When <paramref name="currentSortOrder"/> is set (same-parent update), later siblings
    /// are shifted down instead of up so the item lands on the requested slot.
    /// Returns conflict when other rows must move but ConfirmShiftSortOrder is false.
    /// </summary>
    public static (int sortOrder, CategorySortOrderConflictModel? conflict) Resolve(
        CategoryAddEditModel model,
        List<CategoryEntity> siblings,
        int? currentSortOrder = null)
    {
        var autoSortOrder = GetNextSortOrder(siblings);

        if (model.SortOrder is null or <= 0)
            return (autoSortOrder, null);

        var requested = model.SortOrder.Value;

        if (currentSortOrder is int current)
            return ResolveSameParentMove(model, siblings, current, requested, autoSortOrder);

        return ResolveInsert(model, siblings, requested, autoSortOrder);
    }

    private static (int sortOrder, CategorySortOrderConflictModel? conflict) ResolveInsert(
        CategoryAddEditModel model,
        List<CategoryEntity> siblings,
        int requested,
        int autoSortOrder)
    {
        var needsShift = siblings.Any(s => s.SortOrder >= requested);

        if (!needsShift)
            return (requested, null);

        if (model.ConfirmShiftSortOrder)
        {
            foreach (var sibling in siblings.Where(s => s.SortOrder >= requested))
                sibling.SortOrder += 1;
            return (requested, null);
        }

        return (autoSortOrder, BuildConflict(requested, autoSortOrder));
    }

    private static (int sortOrder, CategorySortOrderConflictModel? conflict) ResolveSameParentMove(
        CategoryAddEditModel model,
        List<CategoryEntity> siblings,
        int current,
        int requested,
        int autoSortOrder)
    {
        if (requested == current)
            return (requested, null);

        var toShift = requested < current
            ? siblings.Where(s => s.SortOrder >= requested && s.SortOrder < current).ToList()
            : siblings.Where(s => s.SortOrder > current && s.SortOrder <= requested).ToList();

        if (toShift.Count == 0)
            return (requested, null);

        if (!model.ConfirmShiftSortOrder)
            return (autoSortOrder, BuildConflict(requested, autoSortOrder));

        var delta = requested < current ? 1 : -1;
        foreach (var sibling in toShift)
            sibling.SortOrder += delta;

        return (requested, null);
    }
}
