namespace SimpleShop.Tests;

public class FrontendHygieneTests
{
    [Fact]
    public void Frontend_HasNoOfflineDomainJson()
    {
        var frontend = FindFrontend();
        var jsonFiles = Directory.GetFiles(frontend, "*.json", SearchOption.AllDirectories)
            .Where(path => !path.Contains($"{Path.DirectorySeparatorChar}.vscode{Path.DirectorySeparatorChar}"))
            .Select(Path.GetFileName)
            .ToList();

        Assert.DoesNotContain("products.json", jsonFiles);
        Assert.DoesNotContain("categories.json", jsonFiles);
        Assert.DoesNotContain("users.json", jsonFiles);
        Assert.DoesNotContain("orders.json", jsonFiles);
    }

    [Fact]
    public void Frontend_HasNoOfflineSeedScriptsOrSupplierPanel()
    {
        var frontend = FindFrontend();
        var js = Directory.GetFiles(frontend, "*.js", SearchOption.AllDirectories)
            .Select(Path.GetFileName)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.DoesNotContain("offline-data.js", js);
        Assert.DoesNotContain("seed-data.js", js);
        Assert.False(Directory.Exists(Path.Combine(frontend, "SupplierPanel")));
    }

    [Fact]
    public void RetainedHtml_DoesNotLoadOfflineScripts()
    {
        var frontend = FindFrontend();
        var html = Directory.GetFiles(frontend, "*.html", SearchOption.AllDirectories);
        foreach (var file in html)
        {
            var text = File.ReadAllText(file);
            Assert.DoesNotContain("offline-data.js", text, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("seed-data.js", text, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("/api/orders/guest", text, StringComparison.OrdinalIgnoreCase);
        }
    }

    private static string FindFrontend()
    {
        var dir = AppContext.BaseDirectory;
        while (dir is not null)
        {
            var candidate = Path.Combine(dir, "frontend");
            if (Directory.Exists(candidate))
                return candidate;
            dir = Directory.GetParent(dir)?.FullName;
        }

        throw new DirectoryNotFoundException("frontend folder was not found.");
    }
}
