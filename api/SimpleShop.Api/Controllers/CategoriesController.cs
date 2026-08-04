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
        var op = await categories.Add(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        var item = await categories.Get((int)op.RecordID!);
        return CreatedAtAction(nameof(GetById), new { id = op.RecordID }, item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryAddEditModel model)
    {
        model.Id = id;
        var op = await categories.Update(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
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
