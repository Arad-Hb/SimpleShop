using DataAccess.Services.Products;
using DomainModel.ViewModels.Product;
using Framework.Common.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Admin)]
[Route("api/admin/products")]
public class AdminProductsController(IProductService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] ProductSearchModel model)
        => Ok(await service.SearchAdminAsync(model));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await service.GetDetailsAsync(id, publicOnly: false);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Add(ProductAddEditModel model)
    {
        var result = await service.AddAsync(model);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ProductAddEditModel model)
    {
        var result = await service.UpdateAsync(id, model);
        return result.Success ? Ok(result) : result.Message.Contains("پیدا نشد") ? NotFound(result) : BadRequest(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await service.DeleteAsync(id);
        return result.Success ? Ok(result) : result.Message.Contains("پیدا نشد") ? NotFound(result) : BadRequest(result);
    }
}
