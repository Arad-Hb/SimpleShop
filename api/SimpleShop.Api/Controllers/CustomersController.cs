using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = Roles.Admin)]
public class CustomersController(IUserRepository users) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<UserListComplex>> Search([FromQuery] UserSearchModel searchModel)
    {
        searchModel.Role = Roles.Customer;
        return Ok(await users.Search(searchModel));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserAddEditModel>> GetById(string id)
    {
        var item = await users.Get(id);
        if (item == null || item.Role != Roles.Customer)
            return NotFound();

        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UserAddEditModel model)
    {
        model.Role = Roles.Customer;
        var op = await users.Add(model);
        if (!op.Success)
            return BadRequest(new { message = op.Message });

        if (string.IsNullOrEmpty(op.RecordKey))
            return Ok(new { message = op.Message });

        var created = await users.Get(op.RecordKey);
        return CreatedAtAction(nameof(GetById), new { id = op.RecordKey }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UserAddEditModel model)
    {
        model.Id = id;
        model.Role = Roles.Customer;

        var existing = await users.Get(id);
        if (existing == null || existing.Role != Roles.Customer)
            return NotFound();

        var op = await users.Update(model);
        if (!op.Success)
            return BadRequest(new { message = op.Message });

        return Ok(await users.Get(id));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await users.Get(id);
        if (existing == null || existing.Role != Roles.Customer)
            return NotFound();

        var op = await users.Delete(id);
        if (op.Success) return NoContent();
        if (op.Message == "کاربر پیدا نشد") return NotFound(new { message = op.Message });
        return BadRequest(new { message = op.Message });
    }
}
