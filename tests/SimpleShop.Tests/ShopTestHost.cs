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

    public void Dispose() => Db.Dispose();
}
