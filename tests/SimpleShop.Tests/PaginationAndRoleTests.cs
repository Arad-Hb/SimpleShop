using DataAccess.Services.Common;
using DomainModel.Context;
using DomainModel.Models;
using DomainModel.ViewModels.Product;
using Framework.Common;
using Framework.Common.Constants;
using Microsoft.EntityFrameworkCore;

namespace SimpleShop.Tests;

public class PaginationAndRoleTests
{
    [Fact]
    public async Task Pagination_CapsPageSizeAt50()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("page-" + Guid.NewGuid())
            .Options;
        await using var db = new ApplicationDbContext(options);
        db.Categories.Add(new Category { Name = "اصلی", IsActive = true, Slug = "root" });
        await db.SaveChangesAsync();
        var parentId = db.Categories.Single().Id;
        var child = new Category { Name = "فرزند", ParentId = parentId, IsActive = true, Slug = "child" };
        db.Categories.Add(child);
        await db.SaveChangesAsync();
        for (var i = 0; i < 55; i++)
        {
            db.Products.Add(new Product
            {
                Name = "p" + i,
                Price = 1,
                Stock = 1,
                CategoryId = child.Id,
                IsActive = true,
                Slug = "p-" + i
            });
        }
        await db.SaveChangesAsync();

        var pagination = new PaginationService();
        var page = new ProductSearchModel { PageIndex = 1, PageSize = 200 };
        var rows = await pagination.PaginateAsync(db.Products.AsQueryable(), page);

        Assert.Equal(50, rows.Count);
        Assert.Equal(50, page.PageSize);
        Assert.Equal(55, page.RecordCount);
    }

    [Fact]
    public void RoleNames_AreAdminAndCustomerOnly()
    {
        Assert.Equal("Admin", RoleNames.Admin);
        Assert.Equal("Customer", RoleNames.Customer);
    }

    [Fact]
    public void PageModel_ComputesPageCount()
    {
        var page = new PageModel { PageIndex = 1, PageSize = 10, RecordCount = 23 };
        Assert.Equal(3, page.PageCount);
    }
}
