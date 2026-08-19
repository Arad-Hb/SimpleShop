using DataAccess.Services.Reports;
using Framework.Common.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Admin)]
[Route("api/admin/reports")]
public class AdminReportsController(IReportService service) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard() => Ok(await service.GetDashboardAsync());
}
