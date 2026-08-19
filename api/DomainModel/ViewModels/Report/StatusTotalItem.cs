namespace DomainModel.ViewModels.Report;

public class StatusTotalItem
{
    public string Status { get; set; } = string.Empty;
    public string StatusTitle { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalAmount { get; set; }
}
