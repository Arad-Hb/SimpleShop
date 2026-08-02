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
[Authorize(Roles = Roles.Customer)]
public class CartController : ControllerBase
{
    private readonly ICartService _service;
    private readonly ShopDbContext _context;

    public CartController(ICartService service, ShopDbContext context)
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
    public async Task<ActionResult<List<CartItemDto>>> GetCart()
    {
        var customerId = await GetCustomerIdAsync();
        if (customerId == null) return NotFound(new { message = "پروفایل مشتری یافت نشد." });
        return Ok(await _service.GetCartAsync(customerId.Value));
    }

    [HttpPost]
    public async Task<ActionResult<CartItemDto>> AddItem(CartItemCreateDto dto)
    {
        var customerId = await GetCustomerIdAsync();
        if (customerId == null) return NotFound(new { message = "پروفایل مشتری یافت نشد." });

        var item = await _service.AddItemAsync(customerId.Value, dto);
        if (item == null) return BadRequest(new { message = "موجودی کافی نیست یا محصول یافت نشد." });
        return Ok(item);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CartItemDto>> UpdateItem(int id, CartItemUpdateDto dto)
    {
        var customerId = await GetCustomerIdAsync();
        if (customerId == null) return NotFound(new { message = "پروفایل مشتری یافت نشد." });

        var item = await _service.UpdateItemAsync(customerId.Value, id, dto);
        if (item == null) return BadRequest(new { message = "آیتم یافت نشد یا موجودی کافی نیست." });
        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> RemoveItem(int id)
    {
        var customerId = await GetCustomerIdAsync();
        if (customerId == null) return NotFound(new { message = "پروفایل مشتری یافت نشد." });

        var removed = await _service.RemoveItemAsync(customerId.Value, id);
        return removed ? NoContent() : NotFound();
    }
}
