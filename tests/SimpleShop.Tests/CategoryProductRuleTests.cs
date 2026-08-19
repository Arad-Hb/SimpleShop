using DomainModel.ViewModels.Category;
using DomainModel.ViewModels.Product;

namespace SimpleShop.Tests;

public class CategoryProductRuleTests
{
    [Fact]
    public async Task Delete_Fails_WhenCategoryHasChildren()
    {
        using var host = new ShopTestHost();
        var seeded = await host.SeedTwoLevelCategoryAsync();

        var result = await host.Categories.DeleteAsync(seeded.Parent.Id);

        Assert.False(result.Success);
        Assert.Contains("زیرمجموعه", result.Message);
    }

    [Fact]
    public async Task Delete_Fails_WhenCategoryHasProducts()
    {
        using var host = new ShopTestHost();
        var seeded = await host.SeedTwoLevelCategoryAsync();
        await host.Products.AddAsync(new ProductAddEditModel
        {
            Name = "لپ‌تاپ آموزشی",
            Price = 1000000,
            Stock = 3,
            CategoryId = seeded.Child.Id
        });

        var result = await host.Categories.DeleteAsync(seeded.Child.Id);

        Assert.False(result.Success);
        Assert.Contains("محصول", result.Message);
    }

    [Fact]
    public async Task Delete_Succeeds_WhenCategoryIsEmpty()
    {
        using var host = new ShopTestHost();
        var add = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "خالی", IsActive = true });
        Assert.True(add.Success);

        var result = await host.Categories.DeleteAsync((int)add.RecordID!);

        Assert.True(result.Success);
    }

    [Fact]
    public async Task Product_MustBelongToChildCategory()
    {
        using var host = new ShopTestHost();
        var seeded = await host.SeedTwoLevelCategoryAsync();

        var parentResult = await host.Products.AddAsync(new ProductAddEditModel
        {
            Name = "روی دسته اصلی",
            Price = 10,
            Stock = 1,
            CategoryId = seeded.Parent.Id
        });
        Assert.False(parentResult.Success);

        var childResult = await host.Products.AddAsync(new ProductAddEditModel
        {
            Name = "روی دسته فرزند",
            Price = 10,
            Stock = 1,
            CategoryId = seeded.Child.Id
        });
        Assert.True(childResult.Success);
    }

    [Fact]
    public async Task ProductDelete_Fails_WhenUsedInOrder()
    {
        using var host = new ShopTestHost();
        var seeded = await host.SeedTwoLevelCategoryAsync();
        var add = await host.Products.AddAsync(new ProductAddEditModel
        {
            Name = "سفارشی",
            Price = 2000,
            Stock = 4,
            CategoryId = seeded.Child.Id
        });
        var productId = (int)add.RecordID!;
        host.Db.Users.Add(new DomainModel.Models.ApplicationUser
        {
            Id = "test-user",
            UserName = "09120000002",
            NormalizedUserName = "09120000002",
            FirstName = "آزمایش",
            LastName = "کاربر",
            PhoneNumber = "09120000002"
        });
        host.Db.Orders.Add(new DomainModel.Models.Order
        {
            UserId = "test-user",
            Status = "pending",
            ShippingFullName = "آزمایش",
            ShippingMobile = "09120000002",
            ShippingAddress = "تهران",
            TotalAmount = 2000,
            OrderItems =
            {
                new DomainModel.Models.OrderItem
                {
                    ProductId = productId,
                    ProductName = "سفارشی",
                    UnitPrice = 2000,
                    Quantity = 1,
                    LineTotal = 2000
                }
            }
        });
        await host.Db.SaveChangesAsync();

        var result = await host.Products.DeleteAsync(productId);
        Assert.False(result.Success);
        Assert.Contains("سفارش", result.Message);
    }
}
