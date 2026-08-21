using DataAccess.Services.Categories;
using DataAccess.Services.Products;
using DataAccess.Services.ShopSettings;
using DomainModel.ViewModels.Product;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/store")]
public class StoreController(
    IShopSettingService settings,
    ICategoryService categories,
    IProductService products) : ControllerBase
{
    [HttpGet("home")]
    public async Task<IActionResult> Home() => Ok(await settings.GetHomeAsync());

    [HttpGet("settings")]
    public async Task<IActionResult> Settings() => Ok(await settings.GetPublicAsync());

    [HttpGet("categories/menu")]
    public async Task<IActionResult> CategoryMenu() => Ok(await categories.GetMenuAsync());

    [HttpGet("categories")]
    public async Task<IActionResult> Categories() => Ok(await categories.GetMenuAsync());

    [HttpGet("categories/{id:int}")]
    public async Task<IActionResult> Category(int id)
    {
        var item = await categories.GetDetailsAsync(id, publicOnly: true);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("categories/by-slug/{slug}")]
    public async Task<IActionResult> CategoryBySlug(string slug)
    {
        var item = await categories.GetBySlugAsync(slug);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("products")]
    public async Task<IActionResult> Products([FromQuery] ProductSearchModel model)
        => Ok(await products.SearchPublicAsync(model));

    [HttpGet("products/{id:int}")]
    public async Task<IActionResult> Product(int id)
    {
        var item = await products.GetDetailsAsync(id, publicOnly: true);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("products/by-slug/{slug}")]
    public async Task<IActionResult> ProductBySlug(string slug)
    {
        var item = await products.GetBySlugAsync(slug);
        return item is null ? NotFound() : Ok(item);
    }
}
