namespace Framework.Common;

public class OperationResult(string? operationName)
{
    public long? RecordID { get; set; }
    public string? RecordKey { get; set; }
    public string? OperationName { get; private set; } = operationName;
    public DateTime OperationDate { get; private set; } = DateTime.Now;
    public bool Success { get; private set; }
    public string Message { get; private set; } = string.Empty;

    public OperationResult ToSuccess(string message)
    {
        Success = true;
        Message = message;
        return this;
    }

    public OperationResult ToSuccess(string message, long recordId)
    {
        RecordID = recordId;
        Success = true;
        Message = message;
        return this;
    }

    public OperationResult ToSuccess(string message, string recordKey)
    {
        RecordKey = recordKey;
        Success = true;
        Message = message;
        return this;
    }

    public OperationResult ToFailed(string message)
    {
        Success = false;
        Message = message;
        return this;
    }

    public OperationResult ToFailed(string message, long recordId)
    {
        RecordID = recordId;
        Success = false;
        Message = message;
        return this;
    }
}
