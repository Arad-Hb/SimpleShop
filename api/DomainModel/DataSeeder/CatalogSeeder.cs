using DomainModel.Models;
using Microsoft.EntityFrameworkCore;

namespace DomainModel.DataSeeder;

/// <summary>
/// Resets and reseeds categories/products from legacy SQL data (<see cref="CatalogSeedData"/>).
/// </summary>
public static class CatalogSeeder
{
    public const string SeedVersion = "legacy-catalog-v1";

    /// <returns>True when catalog was reset and reseeded.</returns>
    public static async Task<bool> ResetIfNeededAsync(SimpleShopDbContext context, bool forceReset = false)
    {
        await EnsureStateTableAsync(context);

        var currentVersion = await GetStoredVersionAsync(context);
        if (!forceReset && currentVersion == SeedVersion)
            return false;

        await ResetCatalogAsync(context);
        await SetStoredVersionAsync(context, SeedVersion);
        return true;
    }

    public static async Task ResetCatalogAsync(SimpleShopDbContext context)
    {
        await WipeCatalogAsync(context);
        await EnsureDefaultSupplierAsync(context);
        await SeedCategoriesAsync(context);
        await SeedProductsAsync(context);
    }

    private static async Task EnsureStateTableAsync(SimpleShopDbContext context)
    {
        await context.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID(N'CatalogSeedStates', N'U') IS NULL
            CREATE TABLE CatalogSeedStates (
                Id INT NOT NULL PRIMARY KEY,
                Version NVARCHAR(100) NOT NULL,
                UpdatedAt DATETIME2 NOT NULL
            )
            """);
    }

    private static async Task<string?> GetStoredVersionAsync(SimpleShopDbContext context)
    {
        await using var command = context.Database.GetDbConnection().CreateCommand();
        command.CommandText = "SELECT Version FROM CatalogSeedStates WHERE Id = 1";
        if (command.Connection?.State != System.Data.ConnectionState.Open)
            await context.Database.OpenConnectionAsync();

        var result = await command.ExecuteScalarAsync();
        return result as string;
    }

    private static async Task SetStoredVersionAsync(SimpleShopDbContext context, string version)
    {
        await context.Database.ExecuteSqlRawAsync("""
            MERGE CatalogSeedStates AS target
            USING (SELECT 1 AS Id) AS source ON target.Id = source.Id
            WHEN MATCHED THEN UPDATE SET Version = {0}, UpdatedAt = {1}
            WHEN NOT MATCHED THEN INSERT (Id, Version, UpdatedAt) VALUES (1, {0}, {1});
            """, version, DateTime.UtcNow);
    }

    private static async Task WipeCatalogAsync(SimpleShopDbContext context)
    {
        // Orders reference products (Restrict) — remove first
        context.OrderItems.RemoveRange(await context.OrderItems.ToListAsync());
        context.Orders.RemoveRange(await context.Orders.ToListAsync());

        context.ProductImages.RemoveRange(await context.ProductImages.ToListAsync());

        // Clear image FKs so FileManager rows don't block category/product delete
        await context.Products.ExecuteUpdateAsync(s => s
            .SetProperty(p => p.PrimaryImageId, (int?)null)
            .SetProperty(p => p.OgImageId, (int?)null));

        await context.Categories.ExecuteUpdateAsync(s => s
            .SetProperty(c => c.ImageFileId, (int?)null)
            .SetProperty(c => c.OgImageId, (int?)null));

        context.Products.RemoveRange(await context.Products.ToListAsync());

        // Self-referencing Restrict — delete deepest categories first
        while (await context.Categories.AnyAsync())
        {
            var leafIds = await context.Categories
                .Where(c => !context.Categories.Any(child => child.ParentId == c.Id))
                .Select(c => c.Id)
                .ToListAsync();

            if (leafIds.Count == 0)
                throw new InvalidOperationException("Unable to delete category tree — possible cycle detected.");

            var leaves = await context.Categories.Where(c => leafIds.Contains(c.Id)).ToListAsync();
            context.Categories.RemoveRange(leaves);
            await context.SaveChangesAsync();
        }
    }

    private static async Task EnsureDefaultSupplierAsync(SimpleShopDbContext context)
    {
        if (await context.Suppliers.AnyAsync(s => s.Id == 1))
            return;

        var connection = context.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
            await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SET IDENTITY_INSERT Suppliers ON;
            INSERT INTO Suppliers (Id, Name, ContactPerson, Phone, Email, Address, ApplicationUserId, IsActive)
            VALUES (1, N'تأمین‌کننده پیش‌فرض', N'مسئول فروش', N'02180000001', N'supplier01@vendor.ir', N'تهران', NULL, 1);
            SET IDENTITY_INSERT Suppliers OFF;
            """;
        await command.ExecuteNonQueryAsync();
    }

    private static async Task SeedCategoriesAsync(SimpleShopDbContext context)
    {
        var now = DateTime.UtcNow;
        var entities = CatalogSeedData.Categories
            .OrderBy(c => c.Id)
            .Select(c => new Category
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Name,
                ParentId = c.ParentId,
                MetaTitle = c.MetaTitle ?? c.Name,
                Slug = ProductCatalog.Slugify(c.Name, c.Id),
                IsActive = true,
                CreatedAt = now
            })
            .ToList();

        await context.Database.OpenConnectionAsync();
        try
        {
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT Categories ON");
            context.Categories.AddRange(entities);
            await context.SaveChangesAsync();
        }
        finally
        {
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT Categories OFF");
        }

        await ApplyCategoryHierarchyAsync(context);
    }

    private static async Task ApplyCategoryHierarchyAsync(SimpleShopDbContext context)
    {
        var all = await context.Categories.ToListAsync();
        var lookup = all.ToDictionary(c => c.Id);

        var roots = all.Where(c => c.ParentId == null).OrderBy(c => c.Id).ToList();
        for (var i = 0; i < roots.Count; i++)
            roots[i].SortOrder = i + 1;

        foreach (var parentId in all.Select(c => c.ParentId).Where(id => id.HasValue).Distinct())
        {
            var siblings = all
                .Where(c => c.ParentId == parentId)
                .OrderBy(c => c.Id)
                .ToList();

            for (var i = 0; i < siblings.Count; i++)
                siblings[i].SortOrder = i + 1;
        }

        foreach (var category in all)
            category.Depth = CategoryHierarchyRules.GetDepth(category.ParentId, lookup);

        await context.SaveChangesAsync();
    }

    private static async Task SeedProductsAsync(SimpleShopDbContext context)
    {
        var now = DateTime.UtcNow;
        var entities = CatalogSeedData.Products
            .OrderBy(p => p.Id)
            .Select(p => new Product
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Name,
                Price = p.Price,
                Stock = 100,
                CategoryId = p.CategoryId,
                SupplierId = p.SupplierId,
                Slug = ProductCatalog.Slugify(p.Name, p.Id),
                MetaTitle = $"{p.Name} | SimpleShop",
                MetaDescription = $"خرید {p.Name} از SimpleShop",
                MetaKeywords = $"SimpleShop | {CatalogSeedData.LegacySeedMarker}",
                IsActive = true,
                CreatedAt = now
            })
            .ToList();

        await context.Database.OpenConnectionAsync();
        try
        {
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT Products ON");
            context.Products.AddRange(entities);
            await context.SaveChangesAsync();
        }
        finally
        {
            await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT Products OFF");
        }
    }
}
