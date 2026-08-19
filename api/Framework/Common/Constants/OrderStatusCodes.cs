namespace Framework.Common.Constants;

public static class OrderStatusCodes
{
    public const string Pending = "pending";
    public const string Processing = "processing";
    public const string Shipped = "shipped";
    public const string Delivered = "delivered";
    public const string Cancelled = "cancelled";

    public static readonly string[] All =
    [
        Pending,
        Processing,
        Shipped,
        Delivered,
        Cancelled
    ];

    public static bool IsValid(string? status)
        => All.Contains(status, StringComparer.OrdinalIgnoreCase);

    public static string Normalize(string? status)
        => string.IsNullOrWhiteSpace(status) ? Pending : status.Trim().ToLowerInvariant();

    public static string ToPersian(string? status) => Normalize(status) switch
    {
        Processing => "در حال پردازش",
        Shipped => "ارسال شده",
        Delivered => "تحویل شده",
        Cancelled => "لغو شده",
        _ => "در انتظار"
    };

    public static bool CustomerCanCancel(string? status)
        => Normalize(status) == Pending;

    public static bool AdminCanCancel(string? status)
    {
        var value = Normalize(status);
        return value is Pending or Processing;
    }

    public static bool CanTransition(string? from, string? to)
    {
        var current = Normalize(from);
        var next = Normalize(to);
        if (current == next)
            return true;

        return (current, next) switch
        {
            (Pending, Processing) => true,
            (Pending, Cancelled) => true,
            (Processing, Shipped) => true,
            (Processing, Cancelled) => true,
            (Shipped, Delivered) => true,
            _ => false
        };
    }
}
