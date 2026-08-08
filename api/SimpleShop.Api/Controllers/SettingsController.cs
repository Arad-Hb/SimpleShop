using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController(IShopSettingsRepository settings) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ShopSettingsModel>> Get()
        => Ok(await settings.Get());

    [HttpPut]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update([FromBody] ShopSettingsModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await settings.Update(model);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(await settings.Get());
    }
}
