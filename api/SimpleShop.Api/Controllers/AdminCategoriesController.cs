using DataAccess.Services.Categories;
using DomainModel.ViewModels.Category;
using Framework.Common;
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

    [HttpGet("tree")]
    public async Task<IActionResult> Tree()
        => Ok(await service.GetTreeAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await service.GetDetailsAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Add(CategoryAddEditModel model)
        => MapSave(await service.AddAsync(model), "افزودن دسته‌بندی");

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CategoryAddEditModel model)
        => MapSave(await service.UpdateAsync(id, model), "ویرایش دسته‌بندی");

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await service.DeleteAsync(id);
        return result.Success ? Ok(result) : result.Message.Contains("پیدا نشد") ? NotFound(result) : BadRequest(result);
    }

    private IActionResult MapSave(CategorySaveResult result, string operationName)
    {
        if (result.SortOrderConflict is not null)
            return Conflict(result);

        var op = new OperationResult(operationName);
        if (result.Success)
            return Ok(op.ToSuccess(result.Message, result.RecordId ?? 0));

        var failed = op.ToFailed(result.Message);
        return result.Message.Contains("پیدا نشد") ? NotFound(failed) : BadRequest(failed);
    }
}
