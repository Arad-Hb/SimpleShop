using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> e)
    {
        e.Property(o => o.UserId).HasMaxLength(450).IsRequired();
        e.Property(o => o.Status).HasMaxLength(20);
        e.Property(o => o.TotalAmount).HasPrecision(18, 2);
        e.Property(o => o.ShippingAddress).HasMaxLength(500);
        e.Property(o => o.PaymentStatus).HasMaxLength(30);

        e.HasOne(o => o.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
