namespace SimpleShop.Models.DTOs;

public class CartItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public int Stock { get; set; }
    public decimal LineTotal => UnitPrice * Quantity;
}

public class CartItemCreateDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; } = 1;
}

public class CartItemUpdateDto
{
    public int Quantity { get; set; }
}

public class OrderDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string? ShippingAddress { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal => UnitPrice * Quantity;
}

public class CreateOrderDto
{
    public string? ShippingAddress { get; set; }
}

public class ReportDto
{
    public int TotalOrders { get; set; }
    public decimal TotalSales { get; set; }
    public List<LowStockProductDto> LowStockProducts { get; set; } = new();
}

public class LowStockProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Stock { get; set; }
    public string CategoryName { get; set; } = string.Empty;
}
