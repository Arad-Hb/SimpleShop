using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DomainModel.ViewModels.User;
using Microsoft.IdentityModel.Tokens;

namespace SimpleShop.Api.Services;

public class JwtTokenService(IConfiguration config)
{
    public string CreateToken(LoginResultModel user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.UserId),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, user.Role),
            new("FullName", user.FullName),
            new("Mobile", user.Mobile)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(double.Parse(config["Jwt:ExpireHours"] ?? "24"));

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
