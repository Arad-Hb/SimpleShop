using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Product;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(IProductRepository products) : ControllerBase
{
    // GET /api/products?page=1&pageSize=12&search=...&categoryId=...&isActive=true
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ProductListComplex>> GetAll(
        [FromQuery] ProductSearchModel searchModel,
        [FromQuery] int page = 1)
    {
        if (page > 0)
            searchModel.PageIndex = page - 1;
        if (searchModel.PageSize <= 0)
            searchModel.PageSize = 12;

        return Ok(await products.Search(searchModel));
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<ProductListComplex>> Search([FromQuery] ProductSearchModel searchModel)
        => Ok(await products.Search(searchModel));

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<ProductListItem>> GetById(int id)
    {
        var item = await products.GetListItem(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Create([FromBody] ProductAddEditModel model)
    {
        var op = await products.Add(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        var item = await products.GetListItem((int)op.RecordID!);
        return CreatedAtAction(nameof(GetById), new { id = op.RecordID }, item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(int id, [FromBody] ProductAddEditModel model)
    {
        model.Id = id;
        var op = await products.Update(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        var item = await products.GetListItem(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var op = await products.Delete(id);
        if (op.Success) return NoContent();
        if (op.Message == "محصول پیدا نشد") return NotFound(new { message = op.Message });
        return BadRequest(new { message = op.Message });
    }

    [HttpPost("{id:int}/images")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> AddImage(int id, [FromBody] ProductImageAddModel model)
    {
        var op = await products.AddProductImage(id, model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        var item = await products.GetListItem(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPut("{id:int}/images/{imageId:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> UpdateImage(int id, int imageId, [FromBody] ProductImageUpdateModel model)
    {
        var op = await products.UpdateProductImage(id, imageId, model);
        if (!op.Success)
        {
            if (op.Message == "تصویر پیدا نشد") return NotFound(new { message = op.Message });
            return BadRequest(new { message = op.Message });
        }
        var item = await products.GetListItem(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpDelete("{id:int}/images/{imageId:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> RemoveImage(int id, int imageId)
    {
        var op = await products.RemoveProductImage(id, imageId);
        if (!op.Success)
        {
            if (op.Message == "تصویر پیدا نشد") return NotFound(new { message = op.Message });
            return BadRequest(new { message = op.Message });
        }
        return NoContent();
    }
}
