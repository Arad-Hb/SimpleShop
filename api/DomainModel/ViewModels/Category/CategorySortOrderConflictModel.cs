namespace DomainModel.ViewModels.Category;

public class CategorySortOrderConflictModel
{
    public bool RequiresConfirmation { get; set; }
    public string Message { get; set; } = string.Empty;
    public int RequestedSortOrder { get; set; }
    public int AutoSortOrder { get; set; }
}
