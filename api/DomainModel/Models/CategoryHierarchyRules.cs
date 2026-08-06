namespace DomainModel.Models;

/// <summary>
/// Root (depth 0) → up to 3 sub-layer levels (depth 1–3).
/// Categories at depth 3 cannot have children.
/// </summary>
public static class CategoryHierarchyRules
{
    public const int MaxDepth = 3;

    public static int GetDepth(int? parentId, IReadOnlyDictionary<int, Category> lookup)
    {
        if (parentId is null) return 0;

        var depth = 0;
        var currentId = parentId;
        var guard = 0;

        while (currentId.HasValue && guard++ < 16)
        {
            depth++;
            if (!lookup.TryGetValue(currentId.Value, out var current))
                break;
            currentId = current.ParentId;
        }

        return depth;
    }

    public static bool CanHaveChildren(int depth) => depth < MaxDepth;

    public static bool IsValidParentDepth(int parentDepth) => parentDepth < MaxDepth;

    public static int ComputeChildDepth(int? parentId, int parentDepth)
        => parentId is null ? 0 : parentDepth + 1;
}
