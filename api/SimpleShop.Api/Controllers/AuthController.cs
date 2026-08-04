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

        return Ok(new
        {
            token = jwt.CreateToken(result),
            username = result.Username,
            role = result.Role,
            fullName = result.FullName,
            customerId = result.CustomerId
        });
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] UserAddEditModel model)
    {
        model.Role = Roles.Customer;
        var op = await users.Add(model);
        if (!op.Success)
            return BadRequest(new { message = op.Message });

        var login = await users.ValidateLogin(new LoginModel
        {
            Username = model.Username,
            Password = model.Password!
        });

        return Ok(new
        {
            token = jwt.CreateToken(login),
            username = login.Username,
            role = login.Role,
            fullName = login.FullName,
            customerId = login.CustomerId
        });
    }
}
