using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DataAccess.Services.Account;
using DomainModel.Models;
using DomainModel.ViewModels.Account;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace SimpleShop.Api.Authentication;

public class JwtTokenGenerator(IOptions<JwtSettings> settings) : IJwtTokenGenerator
{
    public LoginResultModel Generate(ApplicationUser user, IList<string> roles, bool rememberMe)
    {
        var jwt = settings.Value;
        var minutes = rememberMe ? Math.Max(jwt.ExpirationMinutes, 7 * 24 * 60) : jwt.ExpirationMinutes;
        var expires = DateTime.UtcNow.AddMinutes(minutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(ClaimTypes.MobilePhone, user.PhoneNumber ?? string.Empty),
            new(ClaimTypes.GivenName, user.FirstName),
            new(ClaimTypes.Surname, user.LastName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: jwt.Issuer,
            audience: jwt.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expires,
            signingCredentials: credentials);

        return new LoginResultModel
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Expiration = expires,
            UserID = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            MobileNumber = user.PhoneNumber ?? user.UserName ?? string.Empty,
            AvatarPath = user.AvatarPath,
            Roles = roles.ToList()
        };
    }
}
