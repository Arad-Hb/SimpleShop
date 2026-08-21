namespace DomainModel.Models;

/// <summary>
/// Root (depth 0) up to depth 3. Categories at depth 3 cannot have children.
/// Depth is computed by walking ParentId — it is not stored on the entity.
/// </summary>
public static class CategoryHierarchyRules
{
    public const int MaxDepth = 3;

    public static int GetDepth(int? parentId, IReadOnlyDictionary<int, Category> lookup)
    {
        if (parentId is null) return 0;

        var depth = 0;
        var currentId = parentId;
        var seen = new HashSet<int>();

        while (currentId.HasValue && seen.Add(currentId.Value))
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

    public static int GetSubtreeHeight(int categoryId, IReadOnlyDictionary<int, Category> lookup)
        => GetSubtreeHeight(categoryId, lookup, []);

    private static int GetSubtreeHeight(
        int categoryId,
        IReadOnlyDictionary<int, Category> lookup,
        HashSet<int> stack)
    {
        if (!stack.Add(categoryId))
            return 0;

        var children = lookup.Values.Where(c => c.ParentId == categoryId).ToList();
        if (children.Count == 0)
        {
            stack.Remove(categoryId);
            return 0;
        }

        var height = 1 + children.Max(c => GetSubtreeHeight(c.Id, lookup, stack));
        stack.Remove(categoryId);
        return height;
    }

    public static bool IsDescendant(int ancestorId, int nodeId, IReadOnlyDictionary<int, Category> lookup)
    {
        if (!lookup.TryGetValue(nodeId, out var node))
            return false;

        var current = node.ParentId;
        var seen = new HashSet<int>();
        while (current.HasValue && seen.Add(current.Value))
        {
            if (current.Value == ancestorId)
                return true;
            if (!lookup.TryGetValue(current.Value, out var parent))
                break;
            current = parent.ParentId;
        }

        return false;
    }
}
