using DataAccess.Services.ShopSettings;
using DomainModel.ViewModels.Settings;
using Framework.Common.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Admin)]
[Route("api/admin/settings")]
public class AdminSettingsController(IShopSettingService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await service.GetAdminAsync());

    [HttpPut]
    public async Task<IActionResult> Update(ShopSettingsEditModel model)
    {
        var result = await service.UpdateAsync(model);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
