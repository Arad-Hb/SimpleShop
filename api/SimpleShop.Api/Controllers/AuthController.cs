using System.Security.Claims;
using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimpleShop.Api.Services;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IUserRepository users, JwtTokenService jwt) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        var result = await users.ValidateLogin(model);
        if (!result.Success)
            return Unauthorized(new { message = result.Message });

        return Ok(ToAuthResponse(result));
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterModel model)
    {
        var result = await users.RegisterAsync(model);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(ToAuthResponse(result));
    }

    /// <summary>Check if mobile is already registered for a role (once per role).</summary>
    [HttpGet("check-mobile")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckMobile([FromQuery] string mobile, [FromQuery] string role = Roles.Customer)
    {
        if (!IdentityUserNames.IsValidMobile(mobile))
            return BadRequest(new { message = "فرمت شماره موبایل نامعتبر است." });

        if (role is not (Roles.Customer or Roles.Supplier))
            return BadRequest(new { message = "نقش نامعتبر است." });

        var taken = await users.IsMobileTakenForRoleAsync(mobile, role);
        return Ok(new { mobile = IdentityUserNames.NormalizeMobile(mobile), role, available = !taken });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var profile = await users.GetProfileAsync(userId);
        return profile == null ? NotFound() : Ok(profile);
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] ProfileUpdateModel model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var op = await users.UpdateProfileAsync(userId, model);
        if (!op.Success)
            return BadRequest(new { message = op.Message });

        return Ok(await users.GetProfileAsync(userId));
    }

    [HttpPost("change-password")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var op = await users.ChangePasswordAsync(userId, model);
        if (!op.Success)
            return BadRequest(new { message = op.Message });

        return Ok(new { message = op.Message });
    }

    private object ToAuthResponse(LoginResultModel result) => new
    {
        token = jwt.CreateToken(result),
        username = result.Username,
        mobile = result.Mobile,
        role = result.Role,
        fullName = result.FullName,
        userId = result.UserId
    };
}
