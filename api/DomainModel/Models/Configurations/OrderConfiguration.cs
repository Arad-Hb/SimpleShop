using DomainModel.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(30).IsRequired();
        builder.Property(x => x.TotalAmount).HasPrecision(18, 0);
        builder.Property(x => x.ShippingFullName).HasMaxLength(120).IsRequired();
        builder.Property(x => x.ShippingMobile).HasMaxLength(15).IsRequired();
        builder.Property(x => x.ShippingAddress).HasMaxLength(400).IsRequired();
        builder.Property(x => x.ShippingCity).HasMaxLength(80);
        builder.Property(x => x.ShippingPostalCode).HasMaxLength(20);
        builder.Property(x => x.CustomerNote).HasMaxLength(500);
        builder.ToTable(t => t.HasCheckConstraint("CK_Orders_TotalAmount", "[TotalAmount] >= 0"));

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.OrderDate);

        builder.HasOne(x => x.User)
            .WithMany(x => x.Orders)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
