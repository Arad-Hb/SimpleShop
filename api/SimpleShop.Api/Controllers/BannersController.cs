using DataAccess.Services;
using DomainModel.ViewModels.Banner;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BannersController(IBannerRepository banners) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<BannerListItem>>> GetAll([FromQuery] string? placement = null)
        => Ok(await banners.GetActive(placement));
}
