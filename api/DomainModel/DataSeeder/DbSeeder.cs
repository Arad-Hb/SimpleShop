using DomainModel.Models;
using Microsoft.EntityFrameworkCore;

namespace DomainModel.DataSeeder;

public static class DbSeeder
{
    private const int TargetCategories = 10;
    private const int TargetCompanySuppliers = 15;
    private const int TargetProducts = 100;

    public static async Task SeedAsync(SimpleShopDbContext context, string? webRootPath = null)
    {
        await EnsureCategoriesAsync(context);
        await EnsureCategoryHierarchyAsync(context);
        await EnsureCompanySuppliersAsync(context);
        await EnsureProductsAsync(context);

        var root = string.IsNullOrWhiteSpace(webRootPath)
            ? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")
            : webRootPath;
        await MediaDbSeeder.EnsureMediaAsync(context, root);
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
        var rootCount = await context.Categories.CountAsync(c => c.ParentId == null);
        var toAdd = templates
            .Where(t => !existingNames.Contains(t.Name))
            .Select((t, i) => new Category
            {
                Name = t.Name,
                Description = t.Description,
                ParentId = null,
                SortOrder = rootCount + i + 1,
                Depth = 0
            })
            .ToList();

        if (toAdd.Count == 0) return;

        context.Categories.AddRange(toAdd);
        await context.SaveChangesAsync();
    }

    /// <summary>Assign SortOrder to legacy flat categories and recalculate Depth.</summary>
    private static async Task EnsureCategoryHierarchyAsync(SimpleShopDbContext context)
    {
        var all = await context.Categories.ToListAsync();
        if (all.Count == 0) return;

        var roots = all
            .Where(c => c.ParentId == null)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .ToList();

        var needsSort = roots.Any(c => c.SortOrder <= 0);
        if (needsSort)
        {
            for (var i = 0; i < roots.Count; i++)
                roots[i].SortOrder = i + 1;
        }

        var lookup = all.ToDictionary(c => c.Id);
        var needsDepth = false;
        foreach (var category in all)
        {
            var expectedDepth = CategoryHierarchyRules.GetDepth(category.ParentId, lookup);
            if (category.Depth != expectedDepth)
            {
                category.Depth = expectedDepth;
                needsDepth = true;
            }
        }

        if (needsSort || needsDepth)
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
            var category = categories[(i - 1) % categories.Count];
            int? supplierId = supplierIds.Count > 0 ? supplierIds[i % supplierIds.Count] : null;
            list.Add(ProductCatalog.CreateForCategory(i, category, supplierId));
        }

        context.Products.AddRange(list);
        await context.SaveChangesAsync();
    }
}
