using DomainModel.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("OrderItems");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ProductName).HasMaxLength(180).IsRequired();
        builder.Property(x => x.UnitPrice).HasPrecision(18, 0);
        builder.Property(x => x.LineTotal).HasPrecision(18, 0);
        builder.ToTable(t => t.HasCheckConstraint("CK_OrderItems_Quantity", "[Quantity] > 0"));
        builder.ToTable(t => t.HasCheckConstraint("CK_OrderItems_UnitPrice", "[UnitPrice] >= 0"));
        builder.ToTable(t => t.HasCheckConstraint("CK_OrderItems_LineTotal", "[LineTotal] >= 0"));

        builder.HasOne(x => x.Order)
            .WithMany(x => x.OrderItems)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
            .WithMany(x => x.OrderItems)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
