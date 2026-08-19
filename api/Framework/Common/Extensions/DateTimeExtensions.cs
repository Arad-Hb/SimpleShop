using System.Globalization;

namespace Framework.Common.Extensions;

public static class DateTimeExtensions
{
    public static string ToPersianDate(this DateTime dateTime)
    {
        var calendar = new PersianCalendar();
        return $"{calendar.GetYear(dateTime):0000}/{calendar.GetMonth(dateTime):00}/{calendar.GetDayOfMonth(dateTime):00}";
    }

    public static string ToPersianDateTime(this DateTime dateTime)
        => $"{dateTime.ToPersianDate()} {dateTime:HH:mm}";

    public static string? ToPersianDate(this DateTime? dateTime) => dateTime?.ToPersianDate();

    public static string? ToPersianDateTime(this DateTime? dateTime) => dateTime?.ToPersianDateTime();
}
