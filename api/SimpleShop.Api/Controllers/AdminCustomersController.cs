using DataAccess.Services.Customers;
using DomainModel.ViewModels.Customer;
using Framework.Common.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Admin)]
[Route("api/admin/customers")]
public class AdminCustomersController(ICustomerService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] CustomerSearchModel model)
        => Ok(await service.SearchAsync(model));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var item = await service.GetAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Add(CustomerAddEditModel model)
    {
        var result = await service.AddAsync(model);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, CustomerAddEditModel model)
    {
        var result = await service.UpdateAsync(id, model);
        return result.Success ? Ok(result) : result.Message.Contains("پیدا نشد") ? NotFound(result) : BadRequest(result);
    }

    [HttpPost("{id}/activate")]
    public async Task<IActionResult> Activate(string id)
    {
        var result = await service.SetActiveAsync(id, true);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(string id)
    {
        var result = await service.SetActiveAsync(id, false);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
