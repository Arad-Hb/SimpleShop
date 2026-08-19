using DomainModel.Context;
using DomainModel.Models;
using Framework.Common.Constants;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace SimpleShop.Api.Seed;

public class DataSeeder(
    ApplicationDbContext context,
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager,
    IConfiguration configuration)
{
    public const string AdminId = "11111111-1111-1111-1111-111111111111";
    public const string CustomerId = "22222222-2222-2222-2222-222222222222";
    public const string DemoCustomerId = "33333333-3333-3333-3333-333333333333";

    public async Task SeedAsync()
    {
        await SeedRolesAsync();
        await SeedConfiguredUserAsync("SeedUsers:Admin", AdminId, RoleNames.Admin, "09120000001", "Admin@123456", "مدیر", "سیستم");
        var customer = await SeedConfiguredUserAsync("SeedUsers:Customer", CustomerId, RoleNames.Customer, "09120000002", "Customer@123456", "مشتری", "نمونه");
        var demoCustomer = await SeedConfiguredUserAsync("SeedUsers:DemoCustomer", DemoCustomerId, RoleNames.Customer, "09120000003", "Demo@123456", "سارا", "خریدار");
        await SeedCatalogAsync();
        await SeedSettingsAsync();
        await SeedOrdersAsync(customer.Id, demoCustomer.Id);
    }

    private async Task SeedRolesAsync()
    {
        foreach (var role in new[] { RoleNames.Admin, RoleNames.Customer })
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }
    }

    private async Task<ApplicationUser> SeedConfiguredUserAsync(
        string section,
        string id,
        string role,
        string defaultMobile,
        string defaultPassword,
        string defaultFirstName,
        string defaultLastName)
    {
        var mobile = configuration[$"{section}:MobileNumber"] ?? defaultMobile;
        var password = configuration[$"{section}:Password"] ?? defaultPassword;
        var firstName = configuration[$"{section}:FirstName"] ?? defaultFirstName;
        var lastName = configuration[$"{section}:LastName"] ?? defaultLastName;

        var user = await userManager.FindByIdAsync(id) ?? await userManager.FindByNameAsync(mobile);
        if (user is null)
        {
            user = new ApplicationUser
            {
                Id = id,
                FirstName = firstName,
                LastName = lastName,
                UserName = mobile,
                PhoneNumber = mobile,
                PhoneNumberConfirmed = true,
                IsActive = true,
                Address = "تهران، خیابان نمونه، پلاک ۱۲",
                PostalCode = "1234567890",
                CreateDate = DateTime.Now
            };
            var create = await userManager.CreateAsync(user, password);
            if (!create.Succeeded)
                throw new InvalidOperationException("ایجاد کاربر آموزشی انجام نشد: " + string.Join(" | ", create.Errors.Select(x => x.Description)));
        }

        if (!await userManager.IsInRoleAsync(user, role))
            await userManager.AddToRoleAsync(user, role);

        return user;
    }

    private async Task SeedCatalogAsync()
    {
        if (await context.Categories.AnyAsync())
            return;

        var digital = AddRoot("کالای دیجیتال", "digital", 1);
        var home = AddRoot("خانه و آشپزخانه", "home", 2);
        await context.SaveChangesAsync();

        var phones = AddChild(digital.Id, "موبایل", "phones", 1);
        var laptops = AddChild(digital.Id, "لپ‌تاپ", "laptops", 2);
        var accessories = AddChild(digital.Id, "لوازم جانبی", "accessories", 3);
        var appliances = AddChild(home.Id, "لوازم برقی", "appliances", 1);
        var cookware = AddChild(home.Id, "ظروف آشپزخانه", "cookware", 2);
        var decor = AddChild(home.Id, "دکوراسیون", "decor", 3);
        await context.SaveChangesAsync();

        context.Products.AddRange(
            CreateProduct(phones.Id, "گوشی آموزشی A1", 8500000, 12, "ساده", "phone-a1"),
            CreateProduct(phones.Id, "گوشی آموزشی A2", 12400000, 7, "ساده", "phone-a2"),
            CreateProduct(laptops.Id, "لپ‌تاپ دانشجویی ۱۴ اینچ", 28500000, 5, "آموزش‌یار", "laptop-14"),
            CreateProduct(laptops.Id, "لپ‌تاپ سبک ۱۵ اینچ", 34900000, 3, "آموزش‌یار", "laptop-15"),
            CreateProduct(accessories.Id, "هدفون بی‌سیم آموزشی", 1450000, 20, "صدا", "headphone"),
            CreateProduct(accessories.Id, "ماوس و کیبورد مجموعه", 890000, 18, "لوازم", "mouse-keyboard"),
            CreateProduct(appliances.Id, "کتری برقی ۱.۷ لیتر", 980000, 9, "خانه", "kettle"),
            CreateProduct(appliances.Id, "مخلوط‌کن رومیزی", 1650000, 6, "خانه", "blender"),
            CreateProduct(cookware.Id, "قابلمه آلومینیومی ۲۴", 720000, 14, "آشپز", "pot-24"),
            CreateProduct(cookware.Id, "سرویس قاشق و چنگال ۱۲ نفره", 540000, 11, "آشپز", "cutlery"),
            CreateProduct(decor.Id, "آباژور رومیزی چوبی", 1250000, 4, "نور", "lamp"),
            CreateProduct(decor.Id, "گلدان سرامیکی سفید", 390000, 16, "دکور", "vase")
        );
        await context.SaveChangesAsync();
    }

    private async Task SeedSettingsAsync()
    {
        if (await context.ShopSettings.AnyAsync())
            return;

        context.ShopSettings.Add(new ShopSettings
        {
            StoreName = "فروشگاه ساده تحلیل داده",
            StoreDescription = "فروشگاه آموزشی دوره اول برای یادگیری ASP.NET و JavaScript",
            ContactPhone = "02191000000",
            ContactEmail = "shop@example.com",
            Address = "تهران، خیابان آموزش، پلاک ۱",
            Currency = "تومان",
            LowStockThreshold = 5,
            InstagramUrl = "https://instagram.com",
            DefaultSeoTitle = "فروشگاه ساده تحلیل داده",
            DefaultSeoDescription = "خرید آموزشی محصولات با معماری لایه‌ای و JWT",
            HeroTitle = "خرید ساده برای یادگیری",
            HeroSubtitle = "محصولات نمونه، سبد خرید و سفارش واقعی از API"
        });
        await context.SaveChangesAsync();
    }

    private async Task SeedOrdersAsync(string customerId, string demoCustomerId)
    {
        if (await context.Orders.AnyAsync())
            return;

        var products = await context.Products.OrderBy(x => x.Id).ToListAsync();
        if (products.Count < 6)
            return;

        AddSeedOrder(customerId, OrderStatusCodes.Pending, DateTime.Now.AddHours(-6),
            (products[0], 1), (products[4], 1));
        AddSeedOrder(customerId, OrderStatusCodes.Processing, DateTime.Now.AddDays(-1),
            (products[2], 1));
        AddSeedOrder(demoCustomerId, OrderStatusCodes.Delivered, DateTime.Now.AddDays(-6),
            (products[8], 2), (products[10], 1));

        await context.SaveChangesAsync();
    }

    private void AddSeedOrder(string userId, string status, DateTime date, params (Product Product, int Qty)[] lines)
    {
        var order = new Order
        {
            UserId = userId,
            Status = status,
            OrderDate = date,
            ShippingFullName = "گیرنده آموزشی",
            ShippingMobile = "09120000002",
            ShippingAddress = "تهران، خیابان نمونه، پلاک ۱۲",
            ShippingCity = "تهران",
            ShippingPostalCode = "1234567890"
        };

        foreach (var (product, qty) in lines)
        {
            order.OrderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = qty,
                LineTotal = product.Price * qty
            });
            product.Stock = Math.Max(0, product.Stock - qty);
        }

        order.TotalAmount = order.OrderItems.Sum(x => x.LineTotal);
        context.Orders.Add(order);
    }

    private Category AddRoot(string name, string slug, int sort)
    {
        var entity = new Category
        {
            Name = name,
            Slug = slug,
            SortOrder = sort,
            IsActive = true,
            MetaTitle = name,
            CreateDate = DateTime.Now
        };
        context.Categories.Add(entity);
        return entity;
    }

    private Category AddChild(int parentId, string name, string slug, int sort)
    {
        var entity = new Category
        {
            Name = name,
            ParentId = parentId,
            Slug = slug,
            SortOrder = sort,
            IsActive = true,
            MetaTitle = name,
            CreateDate = DateTime.Now
        };
        context.Categories.Add(entity);
        return entity;
    }

    private static Product CreateProduct(int categoryId, string name, decimal price, int stock, string brand, string slug)
        => new()
        {
            Name = name,
            CategoryId = categoryId,
            Price = price,
            Stock = stock,
            MinimumStock = 5,
            BrandName = brand,
            IsActive = true,
            Slug = slug,
            MetaTitle = name,
            Description = $"{name} برای آموزش فروشگاه اینترنتی.",
            CreateDate = DateTime.Now
        };
}
