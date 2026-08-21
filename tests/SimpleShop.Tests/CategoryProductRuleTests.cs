using DomainModel.Models;
using DomainModel.ViewModels.Category;
using DomainModel.ViewModels.Product;
using Microsoft.EntityFrameworkCore;

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

        var result = await host.Categories.DeleteAsync((int)add.RecordId!);

        Assert.True(result.Success);
    }

    [Fact]
    public async Task Product_MustBelongToLeafCategory()
    {
        using var host = new ShopTestHost();
        var seeded = await host.SeedTwoLevelCategoryAsync();

        var parentResult = await host.Products.AddAsync(new ProductAddEditModel
        {
            Name = "روی دسته دارای فرزند",
            Price = 10,
            Stock = 1,
            CategoryId = seeded.Parent.Id
        });
        Assert.False(parentResult.Success);
        Assert.Contains("برگ", parentResult.Message);

        var childResult = await host.Products.AddAsync(new ProductAddEditModel
        {
            Name = "روی دسته برگ",
            Price = 10,
            Stock = 1,
            CategoryId = seeded.Child.Id
        });
        Assert.True(childResult.Success);

        var rootLeaf = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "برگ ریشه", IsActive = true });
        var rootLeafProduct = await host.Products.AddAsync(new ProductAddEditModel
        {
            Name = "روی ریشه بدون فرزند",
            Price = 10,
            Stock = 1,
            CategoryId = (int)rootLeaf.RecordId!
        });
        Assert.True(rootLeafProduct.Success);
    }

    [Fact]
    public async Task Category_Rejects_DepthBeyondThree()
    {
        using var host = new ShopTestHost();
        var tree = await host.SeedFourLevelCategoryAsync();

        var tooDeep = await host.Categories.AddAsync(new CategoryAddEditModel
        {
            Name = "سطح پنجم",
            ParentId = tree.Depth3.Id,
            IsActive = true
        });
        Assert.False(tooDeep.Success);
        Assert.Contains("سطح", tooDeep.Message);
    }

    [Fact]
    public async Task Category_Rejects_CycleAndMoveThatExceedsMaxDepth()
    {
        using var host = new ShopTestHost();
        var tree = await host.SeedFourLevelCategoryAsync();

        var cycle = await host.Categories.UpdateAsync(tree.Depth1.Id, new CategoryAddEditModel
        {
            Name = tree.Depth1.Name,
            ParentId = tree.Depth2.Id,
            SortOrder = tree.Depth1.SortOrder,
            IsActive = true
        });
        Assert.False(cycle.Success);
        Assert.Contains("حلقه", cycle.Message);

        var otherRoot = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "ریشه دیگر", IsActive = true });
        var depth1Target = await host.Categories.AddAsync(new CategoryAddEditModel
        {
            Name = "هدف سطح یک",
            ParentId = (int)otherRoot.RecordId!,
            IsActive = true
        });
        var depth2Target = await host.Categories.AddAsync(new CategoryAddEditModel
        {
            Name = "هدف سطح دو",
            ParentId = (int)depth1Target.RecordId!,
            IsActive = true
        });

        var tooDeep = await host.Categories.UpdateAsync(tree.Depth1.Id, new CategoryAddEditModel
        {
            Name = tree.Depth1.Name,
            ParentId = (int)depth2Target.RecordId!,
            SortOrder = tree.Depth1.SortOrder,
            IsActive = true
        });
        Assert.False(tooDeep.Success);
        Assert.Contains("عمق", tooDeep.Message);
    }

    [Fact]
    public async Task Category_Rejects_ChildUnderCategoryWithProducts()
    {
        using var host = new ShopTestHost();
        var leaf = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "برگ محصول‌دار", IsActive = true });
        await host.Products.AddAsync(new ProductAddEditModel
        {
            Name = "کالا",
            Price = 1,
            Stock = 1,
            CategoryId = (int)leaf.RecordId!
        });

        var child = await host.Categories.AddAsync(new CategoryAddEditModel
        {
            Name = "فرزند غیرمجاز",
            ParentId = (int)leaf.RecordId!,
            IsActive = true
        });
        Assert.False(child.Success);
        Assert.Contains("محصول", child.Message);
    }

    [Fact]
    public async Task SortOrder_RequiresConfirmShift_WhenSlotTaken()
    {
        using var host = new ShopTestHost();
        var first = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "اول", IsActive = true });
        Assert.True(first.Success);

        var conflict = await host.Categories.AddAsync(new CategoryAddEditModel
        {
            Name = "درج در ابتدا",
            SortOrder = 1,
            IsActive = true
        });
        Assert.False(conflict.Success);
        Assert.NotNull(conflict.SortOrderConflict);
        Assert.True(conflict.SortOrderConflict!.RequiresConfirmation);
        Assert.Equal(1, conflict.SortOrderConflict.RequestedSortOrder);

        var shifted = await host.Categories.AddAsync(new CategoryAddEditModel
        {
            Name = "درج در ابتدا",
            SortOrder = 1,
            ConfirmShiftSortOrder = true,
            IsActive = true
        });
        Assert.True(shifted.Success);

        var firstReloaded = await host.Db.Categories.FindAsync((int)first.RecordId!);
        var inserted = await host.Db.Categories.FindAsync((int)shifted.RecordId!);
        Assert.Equal(1, inserted!.SortOrder);
        Assert.Equal(2, firstReloaded!.SortOrder);
    }

    [Fact]
    public async Task Menu_Includes_FullDepthZeroToThree()
    {
        using var host = new ShopTestHost();
        var tree = await host.SeedFourLevelCategoryAsync();

        var menu = await host.Categories.GetMenuAsync();
        var root = Assert.Single(menu);
        Assert.Equal(tree.Root.Id, root.Id);
        Assert.Equal(0, root.Depth);
        var d1 = Assert.Single(root.Children);
        Assert.Equal(1, d1.Depth);
        var d2 = Assert.Single(d1.Children);
        Assert.Equal(2, d2.Depth);
        var d3 = Assert.Single(d2.Children);
        Assert.Equal(3, d3.Depth);
        Assert.Empty(d3.Children);
    }

    [Fact]
    public async Task ProductSearch_ByCategory_IncludesDescendants()
    {
        using var host = new ShopTestHost();
        var tree = await host.SeedFourLevelCategoryAsync();
        await host.Products.AddAsync(new ProductAddEditModel
        {
            Name = "کالای عمق سه",
            Price = 50,
            Stock = 2,
            CategoryId = tree.Depth3.Id
        });

        var atRoot = await host.Products.SearchPublicAsync(new ProductSearchModel { CategoryId = tree.Root.Id });
        Assert.Single(atRoot.Items);

        var atDepth2 = await host.Products.SearchPublicAsync(new ProductSearchModel { CategoryId = tree.Depth2.Id });
        Assert.Single(atDepth2.Items);

        var atDepth3 = await host.Products.SearchPublicAsync(new ProductSearchModel { CategoryId = tree.Depth3.Id });
        Assert.Single(atDepth3.Items);
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

    [Fact]
    public async Task SortOrder_MoveDown_ShiftsSiblingsDown_NotUp()
    {
        using var host = new ShopTestHost();
        var a = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "A", IsActive = true });
        var b = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "B", IsActive = true });
        var c = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "C", IsActive = true });
        Assert.True(a.Success && b.Success && c.Success);

        var conflict = await host.Categories.UpdateAsync((int)a.RecordId!, new CategoryAddEditModel
        {
            Name = "A",
            SortOrder = 3,
            IsActive = true
        });
        Assert.False(conflict.Success);
        Assert.NotNull(conflict.SortOrderConflict);

        var moved = await host.Categories.UpdateAsync((int)a.RecordId!, new CategoryAddEditModel
        {
            Name = "A",
            SortOrder = 3,
            ConfirmShiftSortOrder = true,
            IsActive = true
        });
        Assert.True(moved.Success);

        var reloadedA = await host.Db.Categories.FindAsync((int)a.RecordId!);
        var reloadedB = await host.Db.Categories.FindAsync((int)b.RecordId!);
        var reloadedC = await host.Db.Categories.FindAsync((int)c.RecordId!);
        Assert.Equal(3, reloadedA!.SortOrder);
        Assert.Equal(1, reloadedB!.SortOrder);
        Assert.Equal(2, reloadedC!.SortOrder);
    }

    [Fact]
    public async Task Update_NullSortOrder_KeepsCurrent_ZeroAppends()
    {
        using var host = new ShopTestHost();
        var a = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "A", IsActive = true });
        var b = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "B", IsActive = true });
        var c = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "C", IsActive = true });
        Assert.True(a.Success && b.Success && c.Success);

        var kept = await host.Categories.UpdateAsync((int)b.RecordId!, new CategoryAddEditModel
        {
            Name = "B-renamed",
            SortOrder = null,
            IsActive = true
        });
        Assert.True(kept.Success);
        var reloadedB = await host.Db.Categories.FindAsync((int)b.RecordId!);
        Assert.Equal(2, reloadedB!.SortOrder);
        Assert.Equal("B-renamed", reloadedB.Name);

        var appended = await host.Categories.UpdateAsync((int)a.RecordId!, new CategoryAddEditModel
        {
            Name = "A",
            SortOrder = 0,
            IsActive = true
        });
        Assert.True(appended.Success);
        var reloadedA = await host.Db.Categories.FindAsync((int)a.RecordId!);
        Assert.Equal(4, reloadedA!.SortOrder);
    }

    [Fact]
    public async Task Menu_OmitsInactive_Tree_IncludesInactive()
    {
        using var host = new ShopTestHost();
        var active = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "فعال", IsActive = true });
        var inactive = await host.Categories.AddAsync(new CategoryAddEditModel { Name = "غیرفعال", IsActive = false });
        Assert.True(active.Success && inactive.Success);

        var menu = await host.Categories.GetMenuAsync();
        Assert.DoesNotContain(menu, x => x.Id == (int)inactive.RecordId!);
        Assert.Contains(menu, x => x.Id == (int)active.RecordId!);

        var tree = await host.Categories.GetTreeAsync();
        Assert.Contains(tree, x => x.Id == (int)inactive.RecordId! && !x.IsActive);
        Assert.Contains(tree, x => x.Id == (int)active.RecordId!);
    }

    [Fact]
    public async Task PublicCounts_IgnoreInactiveCategoryAndProduct()
    {
        using var host = new ShopTestHost();
        var tree = await host.SeedFourLevelCategoryAsync();
        await host.Products.AddAsync(new ProductAddEditModel
        {
            Name = "فعال روی برگ",
            Price = 10,
            Stock = 1,
            CategoryId = tree.Depth3.Id
        });
        var hiddenProduct = await host.Products.AddAsync(new ProductAddEditModel
        {
            Name = "مخفی روی برگ",
            Price = 10,
            Stock = 1,
            CategoryId = tree.Depth3.Id
        });
        var hidden = await host.Db.Products.FindAsync((int)hiddenProduct.RecordID!);
        hidden!.IsActive = false;
        tree.Depth3.IsActive = false;
        await host.Db.SaveChangesAsync();

        var menu = await host.Categories.GetMenuAsync();
        var root = Assert.Single(menu);
        Assert.Equal(0, root.InclusiveProductCount);
        Assert.DoesNotContain(FlattenMenu(root), x => x.Id == tree.Depth3.Id);

        var publicDetails = await host.Categories.GetDetailsAsync(tree.Root.Id, publicOnly: true);
        Assert.NotNull(publicDetails);
        Assert.Equal(0, publicDetails!.InclusiveProductCount);

        var adminDetails = await host.Categories.GetDetailsAsync(tree.Root.Id);
        Assert.NotNull(adminDetails);
        Assert.Equal(2, adminDetails!.InclusiveProductCount);
    }

    [Fact]
    public void Hierarchy_Cycle_DoesNotThrow_AndDepthStops()
    {
        var a = new Category { Id = 1, Name = "A", ParentId = 2 };
        var b = new Category { Id = 2, Name = "B", ParentId = 1 };
        var lookup = new Dictionary<int, Category> { [1] = a, [2] = b };

        var depth = CategoryHierarchyRules.GetDepth(a.ParentId, lookup);
        Assert.Equal(2, depth);
        Assert.InRange(CategoryHierarchyRules.GetSubtreeHeight(1, lookup), 0, 2);
        Assert.True(CategoryHierarchyRules.IsDescendant(1, 2, lookup));
    }

    private static IEnumerable<CategoryMenuItem> FlattenMenu(CategoryMenuItem node)
    {
        yield return node;
        foreach (var child in node.Children)
        {
            foreach (var nested in FlattenMenu(child))
                yield return nested;
        }
    }
}
