namespace DomainModel.ViewModels.Category;

public class CategorySaveResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public long? RecordId { get; set; }
    public CategorySortOrderConflictModel? SortOrderConflict { get; set; }

    public static CategorySaveResult Ok(string message, long recordId) => new()
    {
        Success = true,
        Message = message,
        RecordId = recordId
    };

    public static CategorySaveResult Fail(string message) => new()
    {
        Success = false,
        Message = message
    };

    public static CategorySaveResult Conflict(CategorySortOrderConflictModel conflict) => new()
    {
        Success = false,
        Message = conflict.Message,
        SortOrderConflict = conflict
    };
}
