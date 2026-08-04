using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> e)
    {
        e.ToTable("ProductImages");
        e.Property(x => x.AltText).HasMaxLength(300);

        e.HasOne(x => x.Product)
            .WithMany(p => p.Images)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        e.HasOne(x => x.FileManager)
            .WithMany()
            .HasForeignKey(x => x.FileManagerId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasIndex(x => new { x.ProductId, x.SortOrder });
    }
}
