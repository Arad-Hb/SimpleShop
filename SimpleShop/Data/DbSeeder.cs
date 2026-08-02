using Microsoft.EntityFrameworkCore;
using SimpleShop.Models;
using SimpleShop.Models.Entities;

namespace SimpleShop.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ShopDbContext context)
    {
        await context.Database.MigrateAsync();

        if (await context.Users.AnyAsync())
            return;

        var admin = new User
        {
            Username = "admin",
            Email = "admin@simpleshop.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            FullName = "مدیر فروشگاه",
            Role = Roles.Admin
        };

        var customerUser = new User
        {
            Username = "customer",
            Email = "customer@simpleshop.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer123!"),
            FullName = "علی محمدی",
            Role = Roles.Customer
        };

        context.Users.AddRange(admin, customerUser);
        await context.SaveChangesAsync();

        var customer = new Customer
        {
            UserId = customerUser.Id,
            Phone = "09121234567",
            Address = "تهران، خیابان ولیعصر"
        };
        context.Customers.Add(customer);

        var categories = new[]
        {
            new Category { Name = "لپ‌تاپ", Description = "لپ‌تاپ و نوت‌بوک" },
            new Category { Name = "موبایل", Description = "گوشی هوشمند" },
            new Category { Name = "لوازم جانبی", Description = "هدفون، کیبورد و ..." }
        };
        context.Categories.AddRange(categories);
        await context.SaveChangesAsync();

        var suppliers = new[]
        {
            new Supplier { Name = "پخش دیجیتال", ContactPerson = "رضا احمدی", Phone = "02112345678", Email = "info@digital.ir" },
            new Supplier { Name = "تک‌نو", ContactPerson = "سara Karimi", Phone = "02187654321", Email = "sales@techno.ir" }
        };
        context.Suppliers.AddRange(suppliers);
        await context.SaveChangesAsync();

        var products = new[]
        {
            new Product { Name = "لپ‌تاپ ایسوس VivoBook", Description = "لپ‌تاپ ۱۵.۶ اینچ، ۸GB RAM", Price = 28500000, Stock = 12, CategoryId = categories[0].Id, SupplierId = suppliers[0].Id },
            new Product { Name = "لپ‌تاپ لنوو IdeaPad", Description = "لپ‌تاپ ۱۴ اینچ، ۱۶GB RAM", Price = 32000000, Stock = 8, CategoryId = categories[0].Id, SupplierId = suppliers[0].Id },
            new Product { Name = "آیفون ۱۵", Description = "گوشی اپل ۱۲۸GB", Price = 52000000, Stock = 5, CategoryId = categories[1].Id, SupplierId = suppliers[1].Id },
            new Product { Name = "سامسونگ Galaxy S24", Description = "گوشی اندروید ۲۵۶GB", Price = 45000000, Stock = 10, CategoryId = categories[1].Id, SupplierId = suppliers[1].Id },
            new Product { Name = "هدفون Sony WH-1000XM5", Description = "هدفون بی‌سیم نویزکنسلینگ", Price = 12500000, Stock = 20, CategoryId = categories[2].Id, SupplierId = suppliers[0].Id },
            new Product { Name = "کیبورد مکانیکی Logitech", Description = "کیبورد گیمینگ RGB", Price = 4500000, Stock = 3, CategoryId = categories[2].Id, SupplierId = suppliers[1].Id },
            new Product { Name = "ماوس Logitech MX Master", Description = "ماوس بی‌سیم حرفه‌ای", Price = 3800000, Stock = 15, CategoryId = categories[2].Id, SupplierId = suppliers[0].Id },
            new Product { Name = "تبلت iPad Air", Description = "تبلت اپل ۶۴GB", Price = 28000000, Stock = 7, CategoryId = categories[1].Id, SupplierId = suppliers[1].Id }
        };
        context.Products.AddRange(products);
        await context.SaveChangesAsync();
    }
}
