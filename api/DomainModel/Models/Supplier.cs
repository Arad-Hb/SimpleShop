namespace DomainModel.Models;

public class Supplier
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? ApplicationUserId { get; set; }
    public bool IsActive { get; set; } = true;

    public ApplicationUser? ApplicationUser { get; set; }
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
