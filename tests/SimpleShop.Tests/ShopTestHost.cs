using DataAccess.Repositories.Categories;
using DataAccess.Repositories.Products;
using DataAccess.Services.Categories;
using DataAccess.Services.Common;
using DataAccess.Services.Products;
using DomainModel.Context;
using DomainModel.Models;
using DomainModel.ViewModels.Category;
using DomainModel.ViewModels.Product;
using Microsoft.EntityFrameworkCore;

namespace SimpleShop.Tests;

internal sealed class ShopTestHost : IDisposable
{
    public ApplicationDbContext Db { get; }
    public CategoryService Categories { get; }
    public ProductService Products { get; }

    public ShopTestHost()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("shop-" + Guid.NewGuid())
            .Options;
        Db = new ApplicationDbContext(options);
        var pagination = new PaginationService();
        var categories = new CategoryRepository(Db);
        var products = new ProductRepository(Db);
        Categories = new CategoryService(categories, pagination);
        Products = new ProductService(products, categories, pagination);
    }

    public async Task<(Category Parent, Category Child)> SeedTwoLevelCategoryAsync()
    {
        var parent = new Category { Name = "الکترونیک", IsActive = true, Slug = "electronics", SortOrder = 1 };
        Db.Categories.Add(parent);
        await Db.SaveChangesAsync();

        var child = new Category { Name = "لپ‌تاپ", ParentId = parent.Id, IsActive = true, Slug = "laptop", SortOrder = 1 };
        Db.Categories.Add(child);
        await Db.SaveChangesAsync();
        return (parent, child);
    }

    public async Task<(Category Root, Category Depth1, Category Depth2, Category Depth3)> SeedFourLevelCategoryAsync()
    {
        var root = new Category { Name = "ریشه", IsActive = true, Slug = "root", SortOrder = 1 };
        Db.Categories.Add(root);
        await Db.SaveChangesAsync();

        var depth1 = new Category { Name = "سطح یک", ParentId = root.Id, IsActive = true, Slug = "d1", SortOrder = 1 };
        Db.Categories.Add(depth1);
        await Db.SaveChangesAsync();

        var depth2 = new Category { Name = "سطح دو", ParentId = depth1.Id, IsActive = true, Slug = "d2", SortOrder = 1 };
        Db.Categories.Add(depth2);
        await Db.SaveChangesAsync();

        var depth3 = new Category { Name = "سطح سه", ParentId = depth2.Id, IsActive = true, Slug = "d3", SortOrder = 1 };
        Db.Categories.Add(depth3);
        await Db.SaveChangesAsync();

        return (root, depth1, depth2, depth3);
    }

    public void Dispose() => Db.Dispose();
}
