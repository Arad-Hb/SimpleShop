using DataAccess.Services.Orders;
using DomainModel.ViewModels.Order;
using Framework.Common.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimpleShop.Api.Extensions;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Customer)]
[Route("api/customer")]
public class CustomerController(IOrderService orders) : ControllerBase
{
    [HttpPost("orders")]
    public async Task<IActionResult> Checkout(OrderCreateModel model)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized();

        var result = await orders.CheckoutAsync(userId, model);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("orders")]
    public async Task<IActionResult> MyOrders([FromQuery] OrderSearchModel model)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized();

        return Ok(await orders.SearchCustomerAsync(userId, model));
    }

    [HttpGet("orders/{id:int}")]
    public async Task<IActionResult> MyOrder(int id)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized();

        var item = await orders.GetCustomerDetailsAsync(userId, id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("orders/{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized();

        var result = await orders.CancelByCustomerAsync(userId, id);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
