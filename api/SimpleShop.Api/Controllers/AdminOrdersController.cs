using DataAccess.Services.Orders;
using DomainModel.ViewModels.Order;
using Framework.Common.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Admin)]
[Route("api/admin/orders")]
public class AdminOrdersController(IOrderService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] OrderSearchModel model)
        => Ok(await service.SearchAdminAsync(model));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await service.GetAdminDetailsAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, OrderStatusUpdateModel model)
    {
        var result = await service.UpdateStatusAsync(id, model.Status);
        return result.Success ? Ok(result) : result.Message.Contains("پیدا نشد") ? NotFound(result) : BadRequest(result);
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var result = await service.CancelByAdminAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
