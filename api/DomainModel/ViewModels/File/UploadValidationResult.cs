namespace DomainModel.ViewModels.File;

public class UploadValidationResult
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;

    public static UploadValidationResult Ok() => new() { IsValid = true };

    public static UploadValidationResult Fail(string message) => new() { Message = message };
}
