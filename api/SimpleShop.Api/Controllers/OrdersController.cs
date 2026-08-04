using System.Security.Claims;
using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Order;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController(IOrderRepository orders) : ControllerBase
{
    private bool IsAdmin => User.IsInRole(Roles.Admin);

    private int? GetCustomerId()
    {
        var claim = User.FindFirst("CustomerId")?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<ActionResult<OrderListComplex>> Search([FromQuery] OrderSearchModel searchModel)
    {
        if (!IsAdmin)
        {
            var customerId = GetCustomerId();
            if (customerId is null) return Forbid();
            searchModel.CustomerId = customerId;
        }

        return Ok(await orders.Search(searchModel));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDetailsModel>> GetById(int id)
    {
        var details = await orders.GetDetails(id);
        if (details == null) return NotFound();

        if (!IsAdmin)
        {
            var customerId = GetCustomerId();
            if (customerId is null || details.CustomerId != customerId) return Forbid();
        }

        return Ok(details);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Customer)]
    public async Task<IActionResult> Create([FromBody] OrderCreateModel model)
    {
        var customerId = GetCustomerId();
        if (customerId is null) return Unauthorized();
        model.CustomerId = customerId.Value;

        var op = await orders.CreateFromCart(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return CreatedAtAction(nameof(GetById), new { id = op.RecordID }, await orders.GetDetails((int)op.RecordID!));
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdate body)
    {
        var op = await orders.UpdateStatus(id, body.Status);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return Ok(await orders.GetDetails(id));
    }

    public class StatusUpdate
    {
        public string Status { get; set; } = string.Empty;
    }
}
