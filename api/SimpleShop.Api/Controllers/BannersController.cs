using DataAccess.Services;
using DomainModel.Models;
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

    [HttpGet("manage")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<List<BannerListItem>>> GetAllForAdmin([FromQuery] string? placement = null)
        => Ok(await banners.GetAll(placement));

    [HttpGet("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<BannerAddEditModel>> GetById(int id)
    {
        var item = await banners.Get(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Create([FromBody] BannerAddEditModel model)
    {
        var op = await banners.Add(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        var item = await banners.Get((int)op.RecordID!);
        return CreatedAtAction(nameof(GetById), new { id = op.RecordID }, item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(int id, [FromBody] BannerAddEditModel model)
    {
        model.Id = id;
        var op = await banners.Update(model);
        if (!op.Success) return BadRequest(new { message = op.Message });
        return Ok(await banners.Get(id));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var op = await banners.Delete(id);
        if (!op.Success)
        {
            if (op.Message == "بنر پیدا نشد") return NotFound(new { message = op.Message });
            return BadRequest(new { message = op.Message });
        }
        return NoContent();
    }
}
