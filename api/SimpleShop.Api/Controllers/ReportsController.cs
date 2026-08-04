using DataAccess.Services;
using DomainModel.Models;
using DomainModel.ViewModels.Report;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SimpleShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = Roles.Admin)]
public class ReportsController(IOrderRepository orders) : ControllerBase
{
    /// <summary>Full sales dataset for Admin reports (orders, items, customers).</summary>
    [HttpGet("sales")]
    public async Task<ActionResult<SalesReportPayload>> GetSalesReport()
        => Ok(await orders.GetSalesReportData());
}
