using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SimpleShop.Data;
using SimpleShop.Models;
using SimpleShop.Models.DTOs;
using SimpleShop.Services;

namespace SimpleShop.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _service;
    private readonly ShopDbContext _context;

    public OrdersController(IOrderService service, ShopDbContext context)
    {
        _service = service;
        _context = context;
    }

    private async Task<int?> GetCustomerIdAsync()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return await _context.Customers.Where(c => c.UserId == userId).Select(c => (int?)c.Id).FirstOrDefaultAsync();
    }

    [HttpGet]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<List<OrderDto>>> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("my")]
    [Authorize(Roles = Roles.Customer)]
    public async Task<ActionResult<List<OrderDto>>> GetMyOrders()
    {
        var customerId = await GetCustomerIdAsync();
        if (customerId == null) return NotFound(new { message = "پروفایل مشتری یافت نشد." });
        return Ok(await _service.GetByCustomerAsync(customerId.Value));
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var order = await _service.GetByIdAsync(id);
        if (order == null) return NotFound();

        if (User.IsInRole(Roles.Admin)) return Ok(order);

        var customerId = await GetCustomerIdAsync();
        if (customerId == null || order.CustomerId != customerId.Value)
            return Forbid();

        return Ok(order);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Customer)]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderDto dto)
    {
        var customerId = await GetCustomerIdAsync();
        if (customerId == null) return NotFound(new { message = "پروفایل مشتری یافت نشد." });

        var order = await _service.CreateFromCartAsync(customerId.Value, dto);
        if (order == null) return BadRequest(new { message = "سبد خرید خالی است یا موجودی کافی نیست." });
        return Ok(order);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<OrderDto>> UpdateStatus(int id, [FromBody] string status)
    {
        var order = await _service.UpdateStatusAsync(id, status);
        return order == null ? NotFound() : Ok(order);
    }
}
