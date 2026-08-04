using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> e)
    {
        e.Property(p => p.Name).HasMaxLength(200).IsRequired();
        e.Property(p => p.Description).HasMaxLength(2000);
        e.Property(p => p.Price).HasPrecision(18, 2);
        e.Property(p => p.Slug).HasMaxLength(220);
        e.Property(p => p.MetaTitle).HasMaxLength(200);
        e.Property(p => p.MetaDescription).HasMaxLength(500);
        e.Property(p => p.MetaKeywords).HasMaxLength(500);
        e.Property(p => p.CanonicalUrl).HasMaxLength(500);
        e.Property(p => p.OgTitle).HasMaxLength(200);
        e.Property(p => p.OgDescription).HasMaxLength(500);
        e.HasIndex(p => p.Slug);

        e.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        e.HasOne(p => p.Supplier)
            .WithMany(s => s.Products)
            .HasForeignKey(p => p.SupplierId)
            .OnDelete(DeleteBehavior.SetNull);

        e.HasOne(p => p.PrimaryImage)
            .WithMany()
            .HasForeignKey(p => p.PrimaryImageId)
            .OnDelete(DeleteBehavior.SetNull);

        e.HasOne(p => p.OgImage)
            .WithMany()
            .HasForeignKey(p => p.OgImageId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
