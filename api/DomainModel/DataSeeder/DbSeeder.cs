using DomainModel.Models;
using Microsoft.EntityFrameworkCore;

namespace DomainModel.DataSeeder;

public static class DbSeeder
{
    private const string AdminPassword = "Admin123!";
    private const string CustomerPassword = "Customer123!";
    private const string SupplierPassword = "Supplier123!";

    private const int TargetCategories = 10;
    private const int TargetCompanySuppliers = 15;
    private const int TargetProducts = 100;
    private const int TargetUsers = 100; // includes admin + customers + supplier users
    private const int TargetOrders = 120;

    public static async Task SeedAsync(SimpleShopDbContext context, string? webRootPath = null)
    {
        await context.Database.MigrateAsync();

        await EnsureAdminAsync(context);
        await EnsureCategoriesAsync(context);
        await EnsureCompanySuppliersAsync(context);
        await EnsureUsersAsync(context);
        await EnsureProductsAsync(context);
        await EnsureOrdersAsync(context);

        var root = string.IsNullOrWhiteSpace(webRootPath)
            ? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")
            : webRootPath;
        await MediaDbSeeder.EnsureMediaAsync(context, root);
    }

    private static async Task EnsureAdminAsync(SimpleShopDbContext context)
    {
        if (await context.Users.AnyAsync(u => u.Username == "admin"))
            return;

        context.Users.Add(new User
        {
            Username = "admin",
            Email = "admin@simpleshop.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(AdminPassword),
            FullName = "مدیر فروشگاه",
            Role = Roles.Admin
        });
        await context.SaveChangesAsync();
    }

    private static async Task EnsureCategoriesAsync(SimpleShopDbContext context)
    {
        var templates = new (string Name, string Description)[]
        {
            ("لپ‌تاپ", "لپ‌تاپ و نوت‌بوک"),
            ("موبایل", "گوشی هوشمند"),
            ("لوازم جانبی", "هدفون، کیبورد، ماوس و ..."),
            ("تبلت", "تبلت و کتابخوان"),
            ("صوتی و تصویری", "تلویزیون، اسپیکر، ساندبار"),
            ("گیمینگ", "کنسول، دسته‌بازی، تجهیزات گیم"),
            ("خانه و آشپزخانه", "لوازم خانگی کوچک و بزرگ"),
            ("پوشاک", "لباس و کفش"),
            ("زیبایی و سلامت", "آرایشی و بهداشتی"),
            ("کتاب و لوازم تحریر", "کتاب، دفتر و نوشت‌افزار")
        };

        var existingNames = await context.Categories.Select(c => c.Name).ToListAsync();
        var toAdd = templates
            .Where(t => !existingNames.Contains(t.Name))
            .Select(t => new Category { Name = t.Name, Description = t.Description })
            .ToList();

        if (toAdd.Count == 0) return;

        context.Categories.AddRange(toAdd);
        await context.SaveChangesAsync();
    }

    private static async Task EnsureCompanySuppliersAsync(SimpleShopDbContext context)
    {
        var count = await context.Suppliers.CountAsync();
        if (count >= TargetCompanySuppliers) return;

        var cities = new[] { "تهران", "اصفهان", "شیراز", "مشهد", "تبریز", "کرج" };
        var list = new List<Supplier>();

        for (var i = count + 1; i <= TargetCompanySuppliers; i++)
        {
            list.Add(new Supplier
            {
                Name = $"تأمین‌کننده {i:00}",
                ContactPerson = $"مسئول فروش {i}",
                Phone = $"021{80000000 + i}",
                Email = $"supplier{i:00}@vendor.ir",
                Address = $"{cities[i % cities.Length]}، خیابان نمونه، پلاک {i}"
            });
        }

        context.Suppliers.AddRange(list);
        await context.SaveChangesAsync();
    }

    private static async Task EnsureUsersAsync(SimpleShopDbContext context)
    {
        var current = await context.Users.CountAsync();
        if (current >= TargetUsers) return;

        // Rough mix among the 100 users: 1 admin (already), ~15 supplier users, rest customers.
        const int supplierUserTarget = 15;
        var existingSupplierUsers = await context.Users.CountAsync(u => u.Role == Roles.Supplier);
        var existingCustomerUsers = await context.Users.CountAsync(u => u.Role == Roles.Customer);

        // One hash per password (seed-only). Reused so startup stays fast.
        var customerHash = BCrypt.Net.BCrypt.HashPassword(CustomerPassword);
        var supplierHash = BCrypt.Net.BCrypt.HashPassword(SupplierPassword);

        var firstNames = new[]
        {
            "علی", "رضا", "محمد", "حسین", "مهدی", "امیر", "سارا", "مریم", "زهرا", "فاطمه",
            "نیما", "آرش", "پریسا", "نازنین", "کامران", "الهام", "شیدا", "بهرام", "کیان", "هانیه"
        };
        var lastNames = new[]
        {
            "محمدی", "احمدی", "حسینی", "رضایی", "کریمی", "موسوی", "جعفری", "نوری", "کاظمی", "صادقی"
        };

        var existingUsernames = (await context.Users.Select(u => u.Username).ToListAsync()).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var usersToAdd = new List<User>();
        var nextIndex = 1;

        string UniqueUsername(string preferred)
        {
            if (!existingUsernames.Contains(preferred) && usersToAdd.All(u => !string.Equals(u.Username, preferred, StringComparison.OrdinalIgnoreCase)))
            {
                existingUsernames.Add(preferred);
                return preferred;
            }

            while (true)
            {
                var candidate = $"user{nextIndex:000}";
                nextIndex++;
                if (!existingUsernames.Contains(candidate) && usersToAdd.All(u => u.Username != candidate))
                {
                    existingUsernames.Add(candidate);
                    return candidate;
                }
            }
        }

        // Ensure demo customer login exists
        if (!existingUsernames.Contains("customer"))
        {
            usersToAdd.Add(new User
            {
                Username = UniqueUsername("customer"),
                Email = "customer@simpleshop.local",
                PasswordHash = customerHash,
                FullName = "علی محمدی",
                Role = Roles.Customer
            });
        }

        while (existingSupplierUsers < supplierUserTarget && current + usersToAdd.Count < TargetUsers)
        {
            existingSupplierUsers++;
            var n = existingSupplierUsers;
            var username = UniqueUsername($"supplier{n:00}");
            usersToAdd.Add(new User
            {
                Username = username,
                Email = $"{username}@simpleshop.local",
                PasswordHash = supplierHash,
                FullName = $"{firstNames[n % firstNames.Length]} {lastNames[n % lastNames.Length]} (تأمین‌کننده)",
                Role = Roles.Supplier
            });
        }

        while (current + usersToAdd.Count < TargetUsers)
        {
            existingCustomerUsers++;
            var n = existingCustomerUsers;
            var fn = firstNames[n % firstNames.Length];
            var ln = lastNames[(n * 3) % lastNames.Length];
            var username = UniqueUsername(n == 1 ? "customer" : $"customer{n:00}");

            usersToAdd.Add(new User
            {
                Username = username,
                Email = $"{username}@simpleshop.local",
                PasswordHash = customerHash,
                FullName = $"{fn} {ln}",
                Role = Roles.Customer
            });
        }

        if (usersToAdd.Count == 0) return;

        context.Users.AddRange(usersToAdd);
        await context.SaveChangesAsync();

        var customerUsers = usersToAdd.Where(u => u.Role == Roles.Customer).ToList();
        var customers = customerUsers.Select((u, i) => new Customer
        {
            UserId = u.Id,
            Phone = $"0912{(1000000 + u.Id) % 10000000:D7}",
            Address = $"تهران، محله نمونه، خیابان {(i % 40) + 1}، پلاک {u.Id}"
        }).ToList();

        context.Customers.AddRange(customers);
        await context.SaveChangesAsync();
    }

    private static async Task EnsureProductsAsync(SimpleShopDbContext context)
    {
        var count = await context.Products.CountAsync();
        if (count >= TargetProducts) return;

        var categories = await context.Categories.OrderBy(c => c.Id).ToListAsync();
        var supplierIds = await context.Suppliers.Select(s => s.Id).ToListAsync();
        if (categories.Count == 0) return;

        var list = new List<Product>();
        for (var i = count + 1; i <= TargetProducts; i++)
        {
            // Round-robin categories so each group gets matching product types
            var category = categories[(i - 1) % categories.Count];
            int? supplierId = supplierIds.Count > 0 ? supplierIds[i % supplierIds.Count] : null;
            list.Add(ProductCatalog.CreateForCategory(i, category, supplierId));
        }

        context.Products.AddRange(list);
        await context.SaveChangesAsync();
    }

    private static async Task EnsureOrdersAsync(SimpleShopDbContext context)
    {
        var count = await context.Orders.CountAsync();
        if (count >= TargetOrders) return;

        var customerIds = await context.Customers.Select(c => c.Id).ToListAsync();
        var products = await context.Products.AsNoTracking()
            .Select(p => new { p.Id, p.Name, p.Price })
            .ToListAsync();

        if (customerIds.Count == 0 || products.Count == 0) return;

        var statuses = new[] { "Pending", "Processing", "Shipped", "Delivered", "Cancelled" };
        var rng = new Random(20260804);
        var orders = new List<Order>();

        for (var i = count + 1; i <= TargetOrders; i++)
        {
            // Spread across ~12 calendar months (Gregorian stored in DB)
            var monthsBack = (i * 7) % 12;
            var dayOffset = (i * 3) % 27;
            var orderDate = DateTime.UtcNow.Date
                .AddMonths(-monthsBack)
                .AddDays(-dayOffset)
                .AddHours(8 + (i % 12))
                .AddMinutes(i % 60);

            var status = statuses[i % statuses.Length];
            var customerId = customerIds[i % customerIds.Count];
            var itemCount = 1 + (i % 4);
            var orderItems = new List<OrderItem>();
            decimal total = 0;

            for (var j = 0; j < itemCount; j++)
            {
                var product = products[(i + j * 11) % products.Count];
                var qty = 1 + ((i + j) % 3);
                orderItems.Add(new OrderItem
                {
                    ProductId = product.Id,
                    Quantity = qty,
                    UnitPrice = product.Price
                });
                total += product.Price * qty;
            }

            orders.Add(new Order
            {
                CustomerId = customerId,
                OrderDate = orderDate,
                Status = status,
                TotalAmount = total,
                ShippingAddress = $"تهران، آدرس نمونه سفارش {i}",
                OrderItems = orderItems
            });
        }

        // Save in batches to keep EF tracking light
        foreach (var batch in orders.Chunk(40))
        {
            context.Orders.AddRange(batch);
            await context.SaveChangesAsync();
        }

        _ = rng; // keep deterministic seed available if extended later
    }
}
