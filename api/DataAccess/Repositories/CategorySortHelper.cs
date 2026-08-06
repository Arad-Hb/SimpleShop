using DomainModel.Models;
using DomainModel.ViewModels.Category;

namespace DataAccess.Repositories;

internal static class CategorySortHelper
{
    public static int GetNextSortOrder(IReadOnlyList<Category> siblings)
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
    /// Resolves SortOrder for create/update. Null or &lt;= 0 on model means append at end.
    /// Returns conflict when shift is required but <see cref="CategoryAddEditModel.ConfirmShiftSortOrder"/> is false.
    /// </summary>
    public static (int sortOrder, CategorySortOrderConflictModel? conflict) Resolve(
        CategoryAddEditModel model,
        List<Category> siblings)
    {
        var autoSortOrder = GetNextSortOrder(siblings);

        if (model.SortOrder is null or <= 0)
            return (autoSortOrder, null);

        var requested = model.SortOrder.Value;
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
}
