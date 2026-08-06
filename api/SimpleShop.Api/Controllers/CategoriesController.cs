using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Category;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController(ICategoryRepository categories) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<CategoryListItem>>> GetAll()
        => Ok(await categories.GetAll());

    [HttpGet("tree")]
    [AllowAnonymous]
    public async Task<ActionResult<List<CategoryTreeNode>>> GetTree()
        => Ok(await categories.GetTree());

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<CategoryListComplex>> Search([FromQuery] CategorySearchModel searchModel)
        => Ok(await categories.Search(searchModel));

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<CategoryAddEditModel>> GetById(int id)
    {
        var item = await categories.Get(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Create([FromBody] CategoryAddEditModel model)
    {
        var result = await categories.CreateWithResult(model);
        if (result.SortOrderConflict != null)
            return Conflict(result.SortOrderConflict);
        if (!result.Success) return BadRequest(new { message = result.Message });
        var item = await categories.Get((int)result.RecordId!);
        return CreatedAtAction(nameof(GetById), new { id = result.RecordId }, item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryAddEditModel model)
    {
        model.Id = id;
        var result = await categories.UpdateWithResult(model);
        if (result.SortOrderConflict != null)
            return Conflict(result.SortOrderConflict);
        if (!result.Success) return BadRequest(new { message = result.Message });
        return Ok(await categories.Get(id));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var op = await categories.Delete(id);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return NoContent();
    }
}
