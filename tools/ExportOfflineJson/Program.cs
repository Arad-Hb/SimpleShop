using System.Text.Json;
using System.Text.Json.Serialization;
using DomainModel.Models;
using Microsoft.EntityFrameworkCore;

var connStr = args.FirstOrDefault(a => !string.IsNullOrWhiteSpace(a) && a.Contains("Database=", StringComparison.OrdinalIgnoreCase))
    ?? "Server=.;Database=SimpleShopLayeredDb;Trusted_Connection=True;TrustServerCertificate=True;";
var outDirArg = args.FirstOrDefault(a => !string.IsNullOrWhiteSpace(a) && !a.Contains("Database=", StringComparison.OrdinalIgnoreCase));
var outDir = !string.IsNullOrWhiteSpace(outDirArg)
    ? Path.GetFullPath(outDirArg)
    : Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "frontend", "shared", "files"));

Directory.CreateDirectory(outDir);

var options = new DbContextOptionsBuilder<SimpleShopDbContext>()
    .UseSqlServer(connStr)
    .Options;

await using var db = new SimpleShopDbContext(options);

var exportedAt = DateTime.UtcNow;
var jsonOptions = new JsonSerializerOptions
{
    WriteIndented = true,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
};

var categories = await db.Categories.AsNoTracking()
    .OrderBy(c => c.Id)
    .Select(c => new
    {
        c.Id,
        c.Name,
        c.Description,
        c.Slug,
        c.ParentId,
        c.SortOrder,
        c.Depth,
        c.IsActive,
        c.MetaTitle,
        c.MetaDescription,
        c.CreatedAt
    })
    .ToListAsync();

await WriteBundleAsync("categories", categories, exportedAt);

var products = await db.Products.AsNoTracking()
    .Include(p => p.Category)
    .Include(p => p.Supplier)
    .OrderBy(p => p.Id)
    .Select(p => new
    {
        p.Id,
        p.Name,
        p.Description,
        p.Price,
        p.Stock,
        p.CategoryId,
        CategoryName = p.Category.Name,
        p.SupplierId,
        SupplierName = p.Supplier != null ? p.Supplier.Name : null,
        p.Slug,
        p.BrandName,
        p.IsActive,
        p.CreatedAt,
        p.MetaTitle,
        p.MetaDescription
    })
    .ToListAsync();

await WriteBundleAsync("products", products, exportedAt);

var users = await db.Users.AsNoTracking()
    .OrderBy(u => u.RegisterDate)
    .Select(u => new
    {
        u.Id,
        u.UserName,
        u.Email,
        u.PhoneNumber,
        u.FirstName,
        u.LastName,
        u.Address,
        u.PostalCode,
        u.RegisterDate,
        u.IsActive,
        Roles = db.UserRoles
            .Where(ur => ur.UserId == u.Id)
            .Join(db.Roles, ur => ur.RoleId, r => r.Id, (_, r) => r.Name!)
            .ToList()
    })
    .ToListAsync();

await WriteBundleAsync("users", users, exportedAt);

var orderRows = await db.Orders.AsNoTracking()
    .Include(o => o.OrderItems)
    .ThenInclude(i => i.Product)
    .OrderBy(o => o.Id)
    .ToListAsync();

var orders = orderRows.Select(o => new
{
    o.Id,
    o.UserId,
    o.OrderDate,
    o.Status,
    o.PaymentStatus,
    o.TotalAmount,
    o.ShippingAddress,
    Items = o.OrderItems.OrderBy(i => i.Id).Select(i => new
    {
        i.Id,
        i.OrderId,
        i.ProductId,
        ProductName = i.Product?.Name,
        i.Quantity,
        i.UnitPrice,
        Total = i.UnitPrice * i.Quantity
    }).ToList()
}).ToList();

await WriteBundleAsync("orders", orders, exportedAt);

Console.WriteLine($"Exported to {outDir}");
Console.WriteLine($"  categories: {categories.Count}");
Console.WriteLine($"  products:   {products.Count}");
Console.WriteLine($"  users:      {users.Count}");
Console.WriteLine($"  orders:     {orders.Count}");

async Task WriteBundleAsync<T>(string name, List<T> items, DateTime at)
{
    var path = Path.Combine(outDir, $"{name}.json");
    var payload = new { version = "legacy-catalog-v4", exportedAt = at, count = items.Count, items };
    await File.WriteAllTextAsync(path, JsonSerializer.Serialize(payload, jsonOptions));
}
