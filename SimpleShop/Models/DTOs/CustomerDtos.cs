namespace SimpleShop.Models.DTOs;

public class CustomerDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int OrderCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CustomerUpdateDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
}
