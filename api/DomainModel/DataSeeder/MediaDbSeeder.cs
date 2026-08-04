using DomainModel.Models;
using DomainModel.Services;
using Microsoft.EntityFrameworkCore;

namespace DomainModel.DataSeeder;

/// <summary>
/// Downloads real photos into wwwroot/uploads, creates FileManager + thumbnails,
/// attaches thematically matching images to products/categories and seeds banners.
/// </summary>
public static class MediaDbSeeder
{
    private const string AlignMarker = ProductCatalog.AlignMarkerPublic;

    public static async Task EnsureMediaAsync(SimpleShopDbContext context, string webRootPath)
    {
        Directory.CreateDirectory(Path.Combine(webRootPath, "uploads"));

        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(60) };
        http.DefaultRequestHeaders.UserAgent.ParseAdd("SimpleShopSeeder/1.0");
        var media = new MediaStorageService(webRootPath, http);

        await EnsureCategorySeoAndImagesAsync(context, media);
        await AlignProductsAndImagesAsync(context, media);
        await EnsureBannersAsync(context, media);
    }

    private static async Task EnsureCategorySeoAndImagesAsync(SimpleShopDbContext context, MediaStorageService media)
    {
        var categories = await context.Categories.ToListAsync();
        foreach (var category in categories)
        {
            category.Slug ??= ProductCatalog.Slugify(category.Name, category.Id);
            category.MetaTitle ??= $"{category.Name} | SimpleShop";
            category.MetaDescription ??= category.Description ?? $"خرید {category.Name} با بهترین قیمت از SimpleShop";

            if (category.ImageFileId.HasValue) continue;

            var theme = ProductCatalog.ThemeFromCategory(category.Name);
            var source = ProductCatalog.ImageUrlsForTheme(theme)[0];
            try
            {
                var file = await media.DownloadAndStoreAsync(source, "categories", $"theme:{theme}:cat");
                context.FileManagers.Add(file);
                await context.SaveChangesAsync();
                category.ImageFileId = file.Id;
            }
            catch
            {
                // Keep seeding resilient if a remote image fails
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task AlignProductsAndImagesAsync(SimpleShopDbContext context, MediaStorageService media)
    {
        var alreadyAligned = await context.Products.AnyAsync(p =>
            p.MetaKeywords != null && p.MetaKeywords.Contains(AlignMarker));

        var products = await context.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .OrderBy(p => p.Id)
            .ToListAsync();

        if (products.Count == 0) return;

        // Always keep names/categories consistent
        foreach (var product in products)
            ProductCatalog.ApplyAlignedIdentity(product);

        await context.SaveChangesAsync();

        if (alreadyAligned && products.All(p => p.PrimaryImageId != null))
            return;

        // Build themed image pools (few downloads, reused within theme)
        var themePools = new Dictionary<string, List<FileManager>>(StringComparer.OrdinalIgnoreCase);
        foreach (var theme in ProductCatalog.AllThemes)
        {
            var pool = new List<FileManager>();
            var urls = ProductCatalog.ImageUrlsForTheme(theme);
            for (var i = 0; i < urls.Length; i++)
            {
                try
                {
                    var file = await media.DownloadAndStoreAsync(urls[i], "products", $"theme:{theme}:{i + 1}");
                    context.FileManagers.Add(file);
                    await context.SaveChangesAsync();
                    pool.Add(file);
                }
                catch
                {
                    // skip failed download
                }
            }

            if (pool.Count > 0)
                themePools[theme] = pool;
        }

        if (themePools.Count == 0) return;

        foreach (var product in products)
        {
            var theme = ProductCatalog.ThemeFromProduct(product);
            if (!themePools.TryGetValue(theme, out var pool) || pool.Count == 0)
            {
                pool = themePools.Values.First();
            }

            var primary = pool[product.Id % pool.Count];
            var secondary = pool[(product.Id + 1) % pool.Count];

            // Replace gallery links
            if (product.Images.Count > 0)
            {
                context.ProductImages.RemoveRange(product.Images);
                product.Images.Clear();
            }

            product.PrimaryImageId = primary.Id;
            product.OgImageId = primary.Id;
            ApplyProductSeo(product, stampAlign: true);

            context.ProductImages.Add(new ProductImage
            {
                ProductId = product.Id,
                FileManagerId = primary.Id,
                AltText = product.Name,
                IsPrimary = true,
                SortOrder = 0
            });
            if (secondary.Id != primary.Id)
            {
                context.ProductImages.Add(new ProductImage
                {
                    ProductId = product.Id,
                    FileManagerId = secondary.Id,
                    AltText = $"{product.Name} — زاویه دیگر",
                    IsPrimary = false,
                    SortOrder = 1
                });
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task EnsureBannersAsync(SimpleShopDbContext context, MediaStorageService media)
    {
        if (await context.Banners.AnyAsync()) return;

        var specs = new (string Title, string Subtitle, string Button, string Link, string Placement, int Sort, string Url, string Alt)[]
        {
            ("تجربه خرید هوشمند", "هزاران محصول اصل با ارسال سریع و ضمانت بازگشت", "مشاهده شگفت‌انگیزها",
                "/category.html?tag=amazing", BannerPlacements.HeroSlider, 1,
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
                "فروشگاه و خرید آنلاین"),

            ("تا ۵۰٪ روی لوازم خانگی", "فرصت محدود برای پرطرفدارترین برندهای خانه و آشپزخانه", "خرید کنید",
                "/category.html?id=home", BannerPlacements.HeroSlider, 2,
                "https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=1600&q=80",
                "لوازم خانگی مدرن"),

            ("گوشی‌ها و گجت‌های روز", "جدیدترین مدل‌های دیجیتال با قیمت رقابتی", "کاوش کنید",
                "/category.html?id=digital", BannerPlacements.HeroSlider, 3,
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80",
                "گوشی هوشمند"),

            ("پیشنهاد شگفت‌انگیز", "فقط تا پایان امروز — تخفیف‌های داغ", null!,
                "/category.html?tag=amazing", BannerPlacements.SideAd, 1,
                "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80",
                "پیشنهاد ویژه فروش"),

            ("امتیاز بگیرید، جایزه ببرید", "با هر خرید امتیاز باشگاه مشتریان", null!,
                "/category.html?tag=special", BannerPlacements.SideAd, 2,
                "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
                "خرید و پاداش مشتری"),

            ("مد و پوشاک", "استایل تابستانی", null!,
                "/category.html?id=fashion", BannerPlacements.AdRow, 1,
                "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
                "مد و پوشاک"),

            ("خانه و زندگی", "نوسازی با قیمت ویژه", null!,
                "/category.html?id=home", BannerPlacements.AdRow, 2,
                "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80",
                "دکوراسیون خانه"),

            ("زیبایی", "برندهای اصل مراقبت پوست", null!,
                "/category.html?id=beauty", BannerPlacements.AdRow, 3,
                "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80",
                "محصولات زیبایی"),

            ("ورزش", "شروع مسیر تناسب اندام", null!,
                "/category.html?id=sport", BannerPlacements.AdRow, 4,
                "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
                "ورزش و تناسب اندام")
        };

        foreach (var spec in specs)
        {
            try
            {
                var file = await media.DownloadAndStoreAsync(spec.Url, "banners", spec.Alt);
                context.FileManagers.Add(file);
                await context.SaveChangesAsync();

                context.Banners.Add(new Banner
                {
                    Title = spec.Title,
                    Subtitle = spec.Subtitle,
                    ButtonText = spec.Button,
                    LinkUrl = spec.Link,
                    Placement = spec.Placement,
                    SortOrder = spec.Sort,
                    IsActive = true,
                    FileManagerId = file.Id,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
            catch
            {
                // skip failed banner download
            }
        }
    }

    private static void ApplyProductSeo(Product product, bool stampAlign = false)
    {
        product.Slug = ProductCatalog.Slugify(product.Name, product.Id);
        product.MetaTitle = $"{product.Name} | SimpleShop";
        product.MetaDescription = Truncate(
            product.Description ?? $"خرید {product.Name} با بهترین قیمت از فروشگاه SimpleShop", 300);
        var keywords = $"{product.Name}, {product.Category?.Name}, خرید آنلاین, SimpleShop";
        product.MetaKeywords = stampAlign ? $"{keywords} | {AlignMarker}" : keywords;
        product.OgTitle = product.MetaTitle;
        product.OgDescription = product.MetaDescription;
        product.CanonicalUrl = $"/product.html?id={product.Id}";
    }

    private static string Truncate(string value, int max)
        => value.Length <= max ? value : value[..(max - 1)] + "…";
}
