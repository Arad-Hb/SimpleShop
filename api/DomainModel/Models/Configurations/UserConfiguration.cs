using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> e)
    {
        e.HasIndex(u => u.Username).IsUnique();
        e.HasIndex(u => u.Email).IsUnique();
        e.Property(u => u.Username).HasMaxLength(50).IsRequired();
        e.Property(u => u.Email).HasMaxLength(100).IsRequired();
        e.Property(u => u.FullName).HasMaxLength(100);
        e.Property(u => u.Role).HasMaxLength(20);
        e.Property(u => u.PasswordHash).IsRequired();
    }
}
