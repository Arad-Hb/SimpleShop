using DomainModel.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace DomainModel.DataSeeder;

public static class IdentityUserSeeder
{
    public const string CustomerPassword = "Customer123!";
    public const string SupplierPassword = "Supplier123!";

    /// <summary>Demo customer mobile — login with role Customer.</summary>
    public const string DemoCustomerMobile = "09121000001";

    /// <summary>Demo supplier mobile — login with role Supplier.</summary>
    public const string DemoSupplierMobile = "09122000001";

    private const int TargetUsers = 100;
    private const int TargetSupplierUsers = 15;
    private const int TargetOrders = 120;

    public static async Task SeedAsync(IServiceProvider services, SimpleShopDbContext context)
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("IdentityUserSeeder");

        var currentCount = await userManager.Users.CountAsync();
        if (currentCount >= TargetUsers)
        {
            await EnsureSupplierLinksAsync(context, userManager);
            await EnsureOrdersAsync(context, userManager);
            return;
        }

        var firstNames = new[]
        {
            "علی", "رضا", "محمد", "حسین", "مهدی", "امیر", "سارا", "مریم", "زهرا", "فاطمه",
            "نیما", "آرش", "پریسا", "نازنین", "کامران", "الهام", "شیدا", "بهرام", "کیان", "هانیه"
        };
        var lastNames = new[]
        {
            "محمدی", "احمدی", "حسینی", "رضایی", "کریمی", "موسوی", "جعفری", "نوری", "کاظمی", "صادقی"
        };

        var seededSupplierUserIds = new List<string>();

        for (var i = 1; i <= TargetSupplierUsers; i++)
        {
            var mobile = i == 1 ? DemoSupplierMobile : $"091220{i:D5}";
            var firstName = firstNames[i % firstNames.Length];
            var lastName = lastNames[i % lastNames.Length];
            var user = await EnsureUserAsync(userManager, mobile, Roles.Supplier, SupplierPassword, new UserSeedProfile
            {
                FirstName = firstName,
                LastName = lastName,
                Email = $"supplier{i:00}@simpleshop.local",
                Address = $"تهران، خیابان تأمین‌کنندگان، پلاک {i}",
                PostalCode = $"1{i:D4}567890"
            }, logger);

            if (user != null)
                seededSupplierUserIds.Add(user.Id);
        }

        var customerIndex = 0;
        while (await userManager.Users.CountAsync() < TargetUsers && customerIndex < 200)
        {
            customerIndex++;
            var mobile = customerIndex == 1 ? DemoCustomerMobile : $"091210{customerIndex + 1:D5}";
            var fn = firstNames[customerIndex % firstNames.Length];
            var ln = lastNames[(customerIndex * 3) % lastNames.Length];

            await EnsureUserAsync(userManager, mobile, Roles.Customer, CustomerPassword, new UserSeedProfile
            {
                FirstName = fn,
                LastName = ln,
                Email = $"customer{customerIndex:00}@simpleshop.local",
                Address = $"تهران، محله نمونه، خیابان {(customerIndex % 40) + 1}، پلاک {customerIndex}",
                PostalCode = $"1{(customerIndex % 9):0}{customerIndex:D4}12345"
            }, logger);
        }

        await EnsureSupplierLinksAsync(context, userManager, seededSupplierUserIds);
        await EnsureOrdersAsync(context, userManager);

        logger.LogInformation(
            "Identity demo users seeded. Admin: admin/Admin123! | Customer: {CustomerMobile}/{CustomerPass} | Supplier: {SupplierMobile}/{SupplierPass}",
            DemoCustomerMobile, CustomerPassword, DemoSupplierMobile, SupplierPassword);
    }

    private static async Task<ApplicationUser?> EnsureUserAsync(
        UserManager<ApplicationUser> userManager,
        string mobile,
        string role,
        string password,
        UserSeedProfile profile,
        ILogger logger)
    {
        var normalized = IdentityUserNames.NormalizeMobile(mobile);
        if (string.IsNullOrEmpty(normalized))
        {
            logger.LogWarning("Seed skipped invalid mobile {Mobile} for role {Role}", mobile, role);
            return null;
        }

        var userName = IdentityUserNames.BuildUserName(role, normalized);
        var existing = await userManager.FindByNameAsync(userName);
        if (existing != null)
            return existing;

        var user = new ApplicationUser
        {
            UserName = userName,
            Email = profile.Email,
            PhoneNumber = normalized,
            FirstName = profile.FirstName,
            LastName = profile.LastName,
            Address = profile.Address,
            PostalCode = profile.PostalCode,
            IsActive = true,
            RegisterDate = DateTime.UtcNow.AddDays(-profile.DaysRegistered),
            EmailConfirmed = true,
            PhoneNumberConfirmed = true
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            logger.LogWarning("Seed user {UserName} failed: {Errors}", userName, string.Join(", ", result.Errors.Select(e => e.Description)));
            return null;
        }

        await userManager.AddToRoleAsync(user, role);
        return user;
    }

    private static async Task EnsureSupplierLinksAsync(
        SimpleShopDbContext context,
        UserManager<ApplicationUser> userManager,
        List<string>? supplierUserIds = null)
    {
        supplierUserIds ??= new List<string>();

        if (supplierUserIds.Count == 0)
        {
            var supplierUsers = await userManager.GetUsersInRoleAsync(Roles.Supplier);
            supplierUserIds = supplierUsers
                .OrderBy(u => u.RegisterDate)
                .Select(u => u.Id)
                .ToList();
        }

        var companies = await context.Suppliers.OrderBy(s => s.Id).ToListAsync();
        var changed = false;

        for (var i = 0; i < Math.Min(companies.Count, supplierUserIds.Count); i++)
        {
            if (!string.IsNullOrEmpty(companies[i].ApplicationUserId))
                continue;

            companies[i].ApplicationUserId = supplierUserIds[i];
            changed = true;
        }

        if (changed)
            await context.SaveChangesAsync();
    }

    private static async Task EnsureOrdersAsync(SimpleShopDbContext context, UserManager<ApplicationUser> userManager)
    {
        var count = await context.Orders.CountAsync();
        if (count >= TargetOrders)
            return;

        var customerUserIds = (await userManager.GetUsersInRoleAsync(Roles.Customer))
            .Select(u => u.Id)
            .ToList();

        var products = await context.Products.AsNoTracking()
            .Select(p => new { p.Id, p.Name, p.Price })
            .ToListAsync();

        if (customerUserIds.Count == 0 || products.Count == 0)
            return;

        var statuses = new[] { "pending", "processing", "shipped", "delivered", "cancelled" };
        var orders = new List<Order>();

        for (var i = count + 1; i <= TargetOrders; i++)
        {
            var monthsBack = (i * 7) % 12;
            var dayOffset = (i * 3) % 27;
            var orderDate = DateTime.UtcNow.Date
                .AddMonths(-monthsBack)
                .AddDays(-dayOffset)
                .AddHours(8 + (i % 12))
                .AddMinutes(i % 60);

            var status = statuses[i % statuses.Length];
            var userId = customerUserIds[i % customerUserIds.Count];
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
                UserId = userId,
                OrderDate = orderDate,
                Status = status,
                TotalAmount = total,
                ShippingAddress = $"تهران، آدرس نمونه سفارش {i}",
                OrderItems = orderItems
            });
        }

        foreach (var batch in orders.Chunk(40))
        {
            context.Orders.AddRange(batch);
            await context.SaveChangesAsync();
        }
    }

    private sealed class UserSeedProfile
    {
        public string FirstName { get; init; } = string.Empty;
        public string LastName { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
        public string? Address { get; init; }
        public string? PostalCode { get; init; }
        public int DaysRegistered { get; init; } = 30;
    }
}
