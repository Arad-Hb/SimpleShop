using DataAccess.Services.Categories;
using DomainModel.ViewModels.Category;
using Framework.Common.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Admin)]
[Route("api/admin/categories")]
public class AdminCategoriesController(ICategoryService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] CategorySearchModel model)
        => Ok(await service.SearchAsync(model));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await service.GetDetailsAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Add(CategoryAddEditModel model)
    {
        var result = await service.AddAsync(model);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CategoryAddEditModel model)
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
