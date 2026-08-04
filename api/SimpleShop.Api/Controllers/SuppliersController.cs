using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Supplier;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = Roles.Admin)]
public class SuppliersController(ISupplierRepository suppliers) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<SupplierListComplex>> Search([FromQuery] SupplierSearchModel searchModel)
        => Ok(await suppliers.Search(searchModel));

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<SupplierAddEditModel>> GetById(int id)
    {
        var item = await suppliers.Get(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SupplierAddEditModel model)
    {
        var op = await suppliers.Add(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return CreatedAtAction(nameof(GetById), new { id = op.RecordID }, await suppliers.Get((int)op.RecordID!));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SupplierAddEditModel model)
    {
        model.Id = id;
        var op = await suppliers.Update(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return Ok(await suppliers.Get(id));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var op = await suppliers.Delete(id);
        return op.Success ? NoContent() : NotFound(new { message = op.Message });
    }
}
