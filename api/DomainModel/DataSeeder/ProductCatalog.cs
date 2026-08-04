using DomainModel.Models;

namespace DomainModel.DataSeeder;

/// <summary>
/// Keeps product names, categories, and image themes consistent.
/// </summary>
public static class ProductCatalog
{
    public static readonly string[] AllThemes =
    [
        "phone", "tablet", "laptop", "accessory", "audio",
        "gaming", "home", "fashion", "beauty", "books"
    ];

    private static readonly Dictionary<string, CategorySpec> Specs = new(StringComparer.Ordinal)
    {
        ["لپ‌تاپ"] = new(
            ["لپ‌تاپ", "نوت‌بوک"],
            ["ایسوس", "لنوو", "اچ‌پی", "دل", "ایسر", "اپل"],
            "laptop",
            18000000m),
        ["موبایل"] = new(
            ["گوشی هوشمند", "گوشی"],
            ["سامسونگ", "اپل", "شیائومی", "نوکیا", "هواوی"],
            "phone",
            12000000m),
        ["لوازم جانبی"] = new(
            ["هدفون", "کیبورد", "ماوس", "شارژر", "پاوربانک", "کابل"],
            ["لاجی‌تک", "انکر", "سونی", "تی‌پی‌لینک"],
            "accessory",
            450000m),
        ["تبلت"] = new(
            ["تبلت", "کتابخوان"],
            ["سامسونگ", "اپل", "شیائومی", "لنوو"],
            "tablet",
            9000000m),
        ["صوتی و تصویری"] = new(
            ["تلویزیون", "اسپیکر", "ساندبار", "هدفون بلوتوثی"],
            ["سونی", "ال‌جی", "سامسونگ", "جی‌بی‌ال"],
            "audio",
            5000000m),
        ["گیمینگ"] = new(
            ["کنسول بازی", "دسته‌بازی", "صندلی گیمینگ", "هدست گیمینگ"],
            ["سونی", "مایکروسافت", "نینتندو", "لاجی‌تک"],
            "gaming",
            8000000m),
        ["خانه و آشپزخانه"] = new(
            ["جاروبرقی", "مخلوط‌کن", "قهوه‌ساز", "توستر"],
            ["سامسونگ", "ال‌جی", "بوش", "فیلیپس"],
            "home",
            3500000m),
        ["پوشاک"] = new(
            ["کت", "کفش ورزشی", "تی‌شرت", "شلوار جین"],
            ["نایک", "آدیداس", "پوما", "زارا"],
            "fashion",
            1200000m),
        ["زیبایی و سلامت"] = new(
            ["کرم آبرسان", "شامپو", "عطر", "رژ لب"],
            ["نیوآ", "لورآل", "میبلین", "داو"],
            "beauty",
            380000m),
        ["کتاب و لوازم تحریر"] = new(
            ["کتاب", "دفتر", "خودکار", "کیف مدرسه‌ای"],
            ["انتشارات دانش", "پنتر", "فابر کاستل"],
            "books",
            150000m)
    };

    private static readonly Dictionary<string, string[]> ThemeImages = new(StringComparer.OrdinalIgnoreCase)
    {
        ["phone"] =
        [
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80"
        ],
        ["tablet"] =
        [
            "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&w=800&q=80"
        ],
        ["laptop"] =
        [
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80"
        ],
        ["accessory"] =
        [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1625948515291-69613efd103f?auto=format&fit=crop&w=800&q=80"
        ],
        ["audio"] =
        [
            "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
        ],
        ["gaming"] =
        [
            "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1612287230202-1ff1d867d530?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1593305841999-91e0d0e8a5d8?auto=format&fit=crop&w=800&q=80"
        ],
        ["home"] =
        [
            "https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=800&q=80"
        ],
        ["fashion"] =
        [
            "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"
        ],
        ["beauty"] =
        [
            "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1522335789203-aabdfece167e?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1571781926291-c77da220d838?auto=format&fit=crop&w=800&q=80"
        ],
        ["books"] =
        [
            "https://images.unsplash.com/photo-1512820532915-6add19264ace?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1456513080880-7d93aaa2ba92?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=800&q=80"
        ]
    };

    public static string ThemeFromCategory(string? categoryName)
    {
        if (string.IsNullOrWhiteSpace(categoryName)) return "accessory";
        if (Specs.TryGetValue(categoryName, out var spec)) return spec.Theme;
        return ThemeFromText(categoryName);
    }

    public static string ThemeFromProduct(Product product)
    {
        var fromName = ThemeFromText(product.Name);
        if (fromName != "shop") return fromName;
        return ThemeFromCategory(product.Category?.Name);
    }

    public static string[] ImageUrlsForTheme(string theme)
        => ThemeImages.TryGetValue(theme, out var urls) ? urls : ThemeImages["accessory"];

    public static void ApplyAlignedIdentity(Product product)
    {
        var categoryName = product.Category?.Name ?? "";
        if (!Specs.TryGetValue(categoryName, out var spec))
        {
            // Unknown category — keep name but still stamp description
            product.Description ??= $"محصول فروشگاهی در دسته {categoryName}.";
            return;
        }

        var noun = spec.Nouns[product.Id % spec.Nouns.Length];
        var brand = spec.Brands[product.Id % spec.Brands.Length];
        product.Name = $"{noun} {brand} مدل {product.Id:000}";
        product.Description = $"{noun} اصل از برند {brand} در دسته «{categoryName}» — مناسب خرید آنلاین از SimpleShop.";
        product.Price = spec.BasePrice + (product.Id * 173000m) % (spec.BasePrice * 2);
        if (product.Price < 50000m) product.Price = 50000m;
    }

    public static Product CreateForCategory(int index, Category category, int? supplierId)
    {
        if (!Specs.TryGetValue(category.Name, out var spec))
        {
            spec = new(["کالا"], ["برند عمومی"], "accessory", 500000m);
        }

        var noun = spec.Nouns[index % spec.Nouns.Length];
        var brand = spec.Brands[index % spec.Brands.Length];
        var price = spec.BasePrice + (index * 173000m) % (spec.BasePrice * 2);

        return new Product
        {
            Name = $"{noun} {brand} مدل {index:000}",
            Description = $"{noun} اصل از برند {brand} در دسته «{category.Name}» — مناسب خرید آنلاین از SimpleShop.",
            Price = price < 50000m ? 50000m : price,
            Stock = (index * 7) % 40,
            CategoryId = category.Id,
            SupplierId = supplierId,
            CreatedAt = DateTime.UtcNow.AddDays(-(index % 90)),
            Slug = Slugify($"{noun}-{brand}", index),
            MetaTitle = $"{noun} {brand} | SimpleShop",
            MetaDescription = $"خرید {noun} {brand} در دسته {category.Name}",
            MetaKeywords = $"{noun}, {brand}, {category.Name}, SimpleShop | {AlignMarkerPublic}"
        };
    }

    // Exposed so new products get stamped consistently with MediaDbSeeder marker
    public const string AlignMarkerPublic = "catalog-align:v3";

    public static string Slugify(string text, int id)
    {
        var cleaned = new string((text ?? "")
            .Trim()
            .ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
            .ToArray());
        while (cleaned.Contains("--", StringComparison.Ordinal))
            cleaned = cleaned.Replace("--", "-", StringComparison.Ordinal);
        cleaned = cleaned.Trim('-');
        if (string.IsNullOrWhiteSpace(cleaned)) cleaned = "item";
        return $"{cleaned}-{id}";
    }

    private static string ThemeFromText(string? text)
    {
        var t = text ?? "";
        if (t.Contains("گوشی") || t.Contains("موبایل")) return "phone";
        if (t.Contains("تبلت") || t.Contains("کتابخوان")) return "tablet";
        if (t.Contains("لپ") || t.Contains("نوت‌بوک") || t.Contains("نوت بوک")) return "laptop";
        if (t.Contains("تلویزیون") || t.Contains("اسپیکر") || t.Contains("ساندبار") || t.Contains("صوتی")) return "audio";
        if (t.Contains("کنسول") || t.Contains("گیم") || t.Contains("دسته")) return "gaming";
        if (t.Contains("جارو") || t.Contains("مخلوط") || t.Contains("قهوه") || t.Contains("توستر") || t.Contains("خانه") || t.Contains("آشپز")) return "home";
        if (t.Contains("کتاب") || t.Contains("دفتر") || t.Contains("خودکار") || t.Contains("تحریر") || t.Contains("مدرسه‌ای")) return "books";
        if (t.Contains("کت") || t.Contains("کفش") || t.Contains("تی‌شرت") || t.Contains("شلوار") || t.Contains("پوشاک") || t.Contains("مد")) return "fashion";
        if (t.Contains("کرم") || t.Contains("شامپو") || t.Contains("عطر") || t.Contains("رژ") || t.Contains("زیبایی")) return "beauty";
        if (t.Contains("هدفون") || t.Contains("کیبورد") || t.Contains("ماوس") || t.Contains("شارژر") || t.Contains("پاور") || t.Contains("کابل") || t.Contains("جانبی")) return "accessory";
        return "shop";
    }

    private sealed record CategorySpec(string[] Nouns, string[] Brands, string Theme, decimal BasePrice);
}
