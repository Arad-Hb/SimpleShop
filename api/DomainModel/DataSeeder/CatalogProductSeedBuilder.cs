namespace DomainModel.DataSeeder;

/// <summary>
/// Builds catalog products for leaf categories (Depth = 2) with names that match the category.
/// </summary>
public static class CatalogProductSeedBuilder
{
    public const int GeneratedStartId = 17;
    public const int GeneratedCount = 100;

    private static readonly string[] PhoneModels =
    [
        "گلکسی A55", "گلکسی S24", "گلکسی Z Flip", "گلکسی A35", "گلکسی M34",
        "Redmi Note 13", "Poco X6", "Redmi 13C", "13 Pro", "14"
    ];

    private static readonly string[] LaptopModels =
    [
        "VivoBook 15", "ZenBook 14", "TUF Gaming F15", "Ideapad Slim 3", "Victus 15",
        "MacBook Air M2", "MacBook Pro 14", "Nitro 5", "Aspire 5", "Modern 15"
    ];

    private static readonly string[] TabletModels =
    [
        "Galaxy Tab A9", "Galaxy Tab S9", "iPad 10", "iPad Air", "Pad 6",
        "Tab M10", "Surface Go", "Redmi Pad", "Lenovo Tab", "MatePad"
    ];

    private static readonly string[] BeautyBrands =
    [
        "بورژوا", "لورéal", "میبلین", "MAC", "کلینیک", "نیوآ", "گارنیه", "Essence"
    ];

    private static readonly string[] LipShades =
    [
        "رز ملایم", "قرمز کلاسیک", "نود", "زرشکی", "مرجانی", "شرابی"
    ];

    private static readonly string[] GenericBrands =
    [
        "سامسونگ", "اپل", "شیائومی", "سونی", "بوش", "فیلیپس", "پانasonic", "TCL"
    ];

    private static readonly int[] PriorityCategoryIds =
    [
        354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364
    ];

    public static IReadOnlyList<CatalogSeedData.ProductSeed> Build(CatalogSeedData.CategorySeed[] categories)
    {
        var depth2 = GetDepth2Categories(categories);
        if (depth2.Count == 0)
            throw new InvalidOperationException("No Depth=2 categories found for product generation.");

        var priorityIds = PriorityCategoryIds.ToHashSet();
        var priority = depth2.Where(c => priorityIds.Contains(c.Id)).ToList();
        var rest = depth2.Where(c => !priorityIds.Contains(c.Id)).ToList();
        var categoryPicks = BuildCategoryPicks(priority, rest, GeneratedCount);

        var products = new List<CatalogSeedData.ProductSeed>(GeneratedCount);
        for (var i = 0; i < GeneratedCount; i++)
        {
            var cat = categoryPicks[i];
            var id = GeneratedStartId + i;
            var variant = i / categoryPicks.Count + 1;
            var name = BuildProductName(cat.Name, i, variant);
            var price = BuildPrice(cat.Name, id);
            products.Add(new CatalogSeedData.ProductSeed(id, name, price, cat.Id, 1));
        }

        return products;
    }

    private static List<CatalogSeedData.CategorySeed> BuildCategoryPicks(
        List<CatalogSeedData.CategorySeed> priority,
        List<CatalogSeedData.CategorySeed> rest,
        int count)
    {
        var picks = new List<CatalogSeedData.CategorySeed>(count);
        picks.AddRange(priority);

        var slotsLeft = count - picks.Count;
        if (slotsLeft <= 0)
            return picks.Take(count).ToList();

        if (rest.Count == 0)
        {
            while (picks.Count < count)
                picks.Add(priority[picks.Count % priority.Count]);
            return picks;
        }

        for (var i = 0; i < slotsLeft; i++)
        {
            var idx = (i * rest.Count) / slotsLeft;
            picks.Add(rest[idx]);
        }

        return picks;
    }

    public static List<CatalogSeedData.CategorySeed> GetDepth2Categories(CatalogSeedData.CategorySeed[] categories)
    {
        var lookup = categories.ToDictionary(c => c.Id);
        return categories
            .Where(c => GetDepth(c.Id, lookup) == 2)
            .OrderBy(c => c.Id)
            .ToList();
    }

    private static int GetDepth(int categoryId, Dictionary<int, CatalogSeedData.CategorySeed> lookup)
    {
        var depth = 0;
        var current = categoryId;
        while (lookup[current].ParentId is int parentId)
        {
            depth++;
            current = parentId;
        }

        return depth;
    }

    internal static string BuildProductName(string categoryName, int index, int variant)
    {
        var cat = categoryName.Trim();

        if (cat.StartsWith("گوشی ", StringComparison.Ordinal))
        {
            var brand = cat[5..].Trim();
            return $"موبایل {brand} {PhoneModels[index % PhoneModels.Length]}";
        }

        if (cat.StartsWith("تبلت ", StringComparison.Ordinal))
        {
            var label = cat[5..].Trim();
            return $"تبلت {label} {TabletModels[index % TabletModels.Length]}";
        }

        if (cat.StartsWith("لپ‌تاپ ", StringComparison.Ordinal) || cat.StartsWith("لپ تاپ ", StringComparison.Ordinal))
        {
            var label = cat.StartsWith("لپ‌تاپ ", StringComparison.Ordinal) ? cat[6..] : cat[7..];
            return $"لپ‌تاپ {label.Trim()} {LaptopModels[index % LaptopModels.Length]}";
        }

        if (cat.StartsWith("هدفون ", StringComparison.Ordinal))
            return $"{cat} {GenericBrands[index % GenericBrands.Length]} سری {variant}";

        if (cat.StartsWith("اسپیکر ", StringComparison.Ordinal))
            return $"{cat} مدل {GenericBrands[index % GenericBrands.Length]}-{variant:00}";

        if (cat is "رژ لب")
            return $"رژ لب {BeautyBrands[index % BeautyBrands.Length]} {LipShades[index % LipShades.Length]}";

        if (cat is "کرم پودر")
            return $"کرم پودر {BeautyBrands[index % BeautyBrands.Length]} شماره {20 + index % 15}";

        if (cat is "ریمل")
            return $"ریمل {BeautyBrands[index % BeautyBrands.Length]} حجم‌دار مدل {variant}";

        if (cat is "سایه چشم")
            return $"پالت سایه چشم {BeautyBrands[index % BeautyBrands.Length]} {variant} رنگ";

        if (cat is "کرم آبرسان")
            return $"کرم آبرسان {BeautyBrands[index % BeautyBrands.Length]} {50 + variant * 10} میلی‌لیتر";

        if (cat is "ضد آفتاب")
            return $"ضد آفتاب {BeautyBrands[index % BeautyBrands.Length]} SPF {30 + index % 4 * 10}";

        if (cat is "سرم صورت")
            return $"سرم صورت {BeautyBrands[index % BeautyBrands.Length]} {variant} در 1";

        if (cat is "شامپو")
            return $"شامپو {BeautyBrands[index % BeautyBrands.Length]} تقویتی {400 + variant * 50} میلی‌لیتر";

        if (cat is "ماسک مو")
            return $"ماسک مو {BeautyBrands[index % BeautyBrands.Length]} ترمیمی {300 + variant * 25} میلی‌لیتر";

        if (cat is "عطر زنانه")
            return $"عطر زنانه {BeautyBrands[index % BeautyBrands.Length]} {50 + variant * 10} میلی‌لیتر";

        if (cat is "ادکلن مردانه")
            return $"ادکلن مردانه {GenericBrands[index % GenericBrands.Length]} {100 + variant * 10} میلی‌لیتر";

        if (cat.Contains("شارژر", StringComparison.Ordinal))
            return $"{cat} {GenericBrands[index % GenericBrands.Length]} {15 + index % 5 * 5} وات";

        if (cat.Contains("گلس", StringComparison.Ordinal))
            return $"گلس محافظ {cat.Replace("گلس ", "")} {GenericBrands[index % GenericBrands.Length]}";

        if (cat.Contains("قاب", StringComparison.Ordinal) || cat.Contains("کاور", StringComparison.Ordinal))
            return $"قاب محافظ {GenericBrands[index % GenericBrands.Length]} مدل {variant:00}";

        if (cat is "PS5" or "PS4" or "XBox")
        {
            var edition = variant == 1 ? "Standard" : "Digital";
            return $"کنسول {cat} {edition} Edition";
        }

        if (cat.Contains("مانیتور", StringComparison.Ordinal))
            return $"{cat} {GenericBrands[index % GenericBrands.Length]} {22 + index % 8} اینچ";

        if (cat.Contains("پردازنده", StringComparison.Ordinal) || cat.Contains("کارت گرافیک", StringComparison.Ordinal))
            return $"{cat} {GenericBrands[index % GenericBrands.Length]} سری {variant}";

        return $"{cat} {GenericBrands[index % GenericBrands.Length]} مدل {variant:00}";
    }

    private static decimal BuildPrice(string categoryName, int productId)
    {
        var cat = categoryName.Trim();
        decimal basePrice = cat switch
        {
            _ when cat.StartsWith("گوشی ", StringComparison.Ordinal) => 8_000_000m,
            _ when cat.StartsWith("لپ", StringComparison.Ordinal) => 25_000_000m,
            _ when cat.StartsWith("تبلت ", StringComparison.Ordinal) => 6_000_000m,
            _ when cat is "PS5" or "XBox" => 22_000_000m,
            _ when cat.Contains("پردازنده", StringComparison.Ordinal) || cat.Contains("کارت گرافیک", StringComparison.Ordinal) => 12_000_000m,
            _ when cat is "رژ لب" or "کرم پودر" or "ریمل" or "سایه چشم" => 450_000m,
            _ when cat is "کرم آبرسان" or "ضد آفتاب" or "سرم صورت" => 650_000m,
            _ when cat is "شامپو" or "ماسک مو" => 320_000m,
            _ when cat is "عطر زنانه" or "ادکلن مردانه" => 1_800_000m,
            _ when cat.Contains("شارژر", StringComparison.Ordinal) || cat.Contains("کابل", StringComparison.Ordinal) => 350_000m,
            _ when cat.Contains("گلس", StringComparison.Ordinal) || cat.Contains("قاب", StringComparison.Ordinal) => 280_000m,
            _ => 1_200_000m
        };

        var bump = (productId * 137_000m) % (basePrice * 0.4m);
        var price = basePrice + bump;
        return price < 50_000m ? 50_000m : decimal.Round(price, 0);
    }
}
