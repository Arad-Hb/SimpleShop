namespace SimpleShop.Models;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Customer = "Customer";
}

public static class OrderStatus
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string Shipped = "Shipped";
    public const string Delivered = "Delivered";
    public const string Cancelled = "Cancelled";
}
