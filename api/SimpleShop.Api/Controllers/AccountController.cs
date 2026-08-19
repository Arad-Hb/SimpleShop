using DataAccess.Services.Account;
using DomainModel.ViewModels.Account;
using Framework.Common;
using Framework.Common.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimpleShop.Api.Extensions;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController(IAccountService service) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterModel model)
    {
        var result = await service.RegisterAsync(model);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginModel model)
    {
        var result = await service.LoginAsync(model);
        return result is null
            ? Unauthorized(new { success = false, message = "شماره موبایل یا رمز عبور صحیح نیست." })
            : Ok(result);
    }

    [HttpGet("check-mobile")]
    public async Task<IActionResult> CheckMobile([FromQuery] string mobile)
        => Ok(new { exists = await service.MobileExistsAsync(mobile) });

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
        => Ok(await service.LogoutAsync(User.GetUserId()));

    [Authorize]
    [HttpGet("authenticated-user")]
    public async Task<IActionResult> AuthenticatedUser()
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized();

        var result = await service.GetAuthenticatedUserAsync(userId);
        return result is null ? Unauthorized() : Ok(result);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(ProfileUpdateModel model)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized();

        var result = await service.UpdateProfileAsync(userId, model);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordModel model)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized();

        var result = await service.ChangePasswordAsync(userId, model);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
