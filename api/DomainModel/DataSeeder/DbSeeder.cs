using DomainModel.Models;

namespace DomainModel.DataSeeder;

public static class DbSeeder
{
    /// <summary>Set when catalog rows were wiped and reseeded during this startup.</summary>
    public static bool CatalogWasReset { get; private set; }

    public static async Task SeedAsync(SimpleShopDbContext context, bool forceReset = false)
    {
        CatalogWasReset = await CatalogSeeder.ResetIfNeededAsync(context, forceReset);
    }
}
