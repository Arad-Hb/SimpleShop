using System.Security.Claims;
using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Order;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using SimpleShop.Api.Services;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController(IOrderRepository orders, IUserRepository users, JwtTokenService jwt) : ControllerBase
{
    private bool IsAdmin => User.IsInRole(Roles.Admin);

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<ActionResult<OrderListComplex>> Search([FromQuery] OrderSearchModel searchModel)
    {
        if (!IsAdmin)
        {
            var userId = GetUserId();
            if (userId is null) return Forbid();
            searchModel.UserId = userId;
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
            var userId = GetUserId();
            if (userId is null || details.UserId != userId) return Forbid();
        }

        return Ok(details);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Customer)]
    public async Task<IActionResult> Create([FromBody] OrderCreateModel model)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        model.UserId = userId;

        var op = await orders.CreateFromItems(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return CreatedAtAction(nameof(GetById), new { id = op.RecordID }, await orders.GetDetails((int)op.RecordID!));
    }

    /// <summary>Guest checkout — no JWT. Finds or creates Customer by mobile, then creates order.</summary>
    [HttpPost("guest")]
    [AllowAnonymous]
    public async Task<IActionResult> GuestCheckout([FromBody] GuestCheckoutModel model)
    {
        if (model.Items == null || model.Items.Count == 0)
            return BadRequest(new { message = "سبد خرید خالی است." });

        var ensured = await users.EnsureCustomerForGuestCheckoutAsync(
            model.Mobile,
            model.FirstName,
            model.LastName,
            model.ShippingAddress,
            model.Password);

        if (!ensured.Success || string.IsNullOrEmpty(ensured.UserId))
            return BadRequest(new { message = ensured.Message });

        var orderModel = new OrderCreateModel
        {
            UserId = ensured.UserId,
            ShippingAddress = model.ShippingAddress,
            Items = model.Items
        };

        var op = await orders.CreateFromItems(orderModel);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return CreatedAtAction(nameof(GetById), new { id = op.RecordID }, await orders.GetDetails((int)op.RecordID!));
    }

    /// <summary>Payment first, then register/find Customer and create a paid order.</summary>
    [HttpPost("complete-checkout")]
    [AllowAnonymous]
    public async Task<IActionResult> CompleteCheckout([FromBody] CompleteCheckoutModel model)
    {
        if (model.Items == null || model.Items.Count == 0)
            return BadRequest(new { message = "کارت خرید خالی است." });

        if (string.IsNullOrWhiteSpace(model.PaymentReference))
            return BadRequest(new { message = "پرداخت تأیید نشده است." });

        var auth = await users.EnsureCustomerAfterPaymentAsync(
            model.Mobile,
            model.FirstName,
            model.LastName,
            model.ShippingAddress,
            model.PostalCode);

        if (!auth.Success || string.IsNullOrEmpty(auth.UserId))
            return BadRequest(new { message = auth.Message });

        var orderModel = new OrderCreateModel
        {
            UserId = auth.UserId,
            ShippingAddress = model.ShippingAddress,
            PaymentStatus = "paid",
            Items = model.Items
        };

        var op = await orders.CreateFromItems(orderModel);
        if (!op.Success) return BadRequest(new { message = op.Message });

        var details = await orders.GetDetails((int)op.RecordID!);
        return Ok(new
        {
            order = details,
            token = jwt.CreateToken(auth),
            username = auth.Username,
            mobile = auth.Mobile,
            role = auth.Role,
            userId = auth.UserId,
            paymentReference = model.PaymentReference
        });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(int id, [FromBody] OrderCreateModel model)
    {
        model.Id = id;
        var op = await orders.Update(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return Ok(await orders.GetDetails(id));
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdate body)
    {
        var op = await orders.UpdateStatus(id, body.Status);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return Ok(await orders.GetDetails(id));
    }

    [HttpPut("{id:int}/payment")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> UpdatePaymentStatus(int id, [FromBody] PaymentStatusUpdate body)
    {
        var op = await orders.UpdatePaymentStatus(id, body.PaymentStatus);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return Ok(await orders.GetDetails(id));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var op = await orders.Delete(id);
        return op.Success ? NoContent() : NotFound(new { message = op.Message });
    }

    public class StatusUpdate
    {
        public string Status { get; set; } = string.Empty;
    }

    public class PaymentStatusUpdate
    {
        public string PaymentStatus { get; set; } = string.Empty;
    }
}
