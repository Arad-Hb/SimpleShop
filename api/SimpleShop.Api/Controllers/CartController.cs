using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Cart;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = Roles.Customer)]
public class CartController(ICartRepository cart) : ControllerBase
{
    private int? GetCustomerId()
    {
        var claim = User.FindFirst("CustomerId")?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<ActionResult<CartListComplex>> GetMyCart()
    {
        var customerId = GetCustomerId();
        if (customerId is null) return Unauthorized();
        return Ok(await cart.Search(new CartSearchModel { CustomerId = customerId.Value, PageSize = 100 }));
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] CartItemAddEditModel model)
    {
        var customerId = GetCustomerId();
        if (customerId is null) return Unauthorized();
        model.CustomerId = customerId.Value;
        var op = await cart.Add(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return Ok(await cart.Search(new CartSearchModel { CustomerId = customerId.Value, PageSize = 100 }));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CartItemAddEditModel model)
    {
        var customerId = GetCustomerId();
        if (customerId is null) return Unauthorized();
        model.Id = id;
        model.CustomerId = customerId.Value;
        var op = await cart.Update(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return Ok(await cart.Get(id));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var op = await cart.Delete(id);
        return op.Success ? NoContent() : NotFound(new { message = op.Message });
    }

    [HttpDelete]
    public async Task<IActionResult> Clear()
    {
        var customerId = GetCustomerId();
        if (customerId is null) return Unauthorized();
        var op = await cart.Clear(customerId.Value);
        return op.Success ? NoContent() : BadRequest(new { message = op.Message });
    }
}
