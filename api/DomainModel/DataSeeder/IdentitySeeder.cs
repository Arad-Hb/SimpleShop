using DomainModel.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace DomainModel.DataSeeder;

public static class IdentitySeeder
{
    private const string AdminPassword = "Admin123!";

    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("IdentitySeeder");

        await EnsureRolesAsync(roleManager);
        await EnsureAdminAsync(userManager, logger);
    }

    private static async Task EnsureRolesAsync(RoleManager<ApplicationRole> roleManager)
    {
        foreach (var role in new[] { Roles.Admin, Roles.Customer, Roles.Supplier })
        {
            if (await roleManager.RoleExistsAsync(role)) continue;
            await roleManager.CreateAsync(new ApplicationRole
            {
                Name = role,
                Description = role
            });
        }
    }

    private static async Task EnsureAdminAsync(UserManager<ApplicationUser> userManager, ILogger logger)
    {
        if (await userManager.FindByNameAsync("admin") != null)
            return;

        var admin = new ApplicationUser
        {
            UserName = "admin",
            Email = "admin@simpleshop.local",
            FirstName = "مدیر",
            LastName = "فروشگاه",
            IsActive = true,
            RegisterDate = DateTime.UtcNow,
            EmailConfirmed = true,
            PhoneNumberConfirmed = true
        };

        var result = await userManager.CreateAsync(admin, AdminPassword);
        if (!result.Succeeded)
        {
            logger.LogWarning("Admin seed failed: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
            return;
        }

        await userManager.AddToRoleAsync(admin, Roles.Admin);
        logger.LogInformation("Seeded admin user (admin / {Password})", AdminPassword);
    }
}
