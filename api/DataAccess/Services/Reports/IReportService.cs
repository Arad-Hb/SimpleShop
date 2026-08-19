using DomainModel.ViewModels.Report;

namespace DataAccess.Services.Reports;

public interface IReportService
{
    Task<DashboardReportModel> GetDashboardAsync();
}
