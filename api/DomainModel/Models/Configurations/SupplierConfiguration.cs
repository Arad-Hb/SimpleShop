using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
{
    public void Configure(EntityTypeBuilder<Supplier> e)
    {
        e.Property(s => s.Name).HasMaxLength(100).IsRequired();
        e.Property(s => s.ContactPerson).HasMaxLength(100);
        e.Property(s => s.Phone).HasMaxLength(20);
        e.Property(s => s.Email).HasMaxLength(100);
        e.Property(s => s.Address).HasMaxLength(300);
    }
}
