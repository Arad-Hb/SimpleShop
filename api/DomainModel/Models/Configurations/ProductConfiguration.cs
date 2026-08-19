using DomainModel.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(180).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2000);
        builder.Property(x => x.BrandName).HasMaxLength(80);
        builder.Property(x => x.Slug).HasMaxLength(200);
        builder.Property(x => x.MetaTitle).HasMaxLength(180);
        builder.Property(x => x.MetaDescription).HasMaxLength(320);
        builder.Property(x => x.ImagePath).HasMaxLength(500);
        builder.Property(x => x.ThumbnailPath).HasMaxLength(500);
        builder.Property(x => x.Price).HasPrecision(18, 0);
        builder.ToTable(t => t.HasCheckConstraint("CK_Products_Price", "[Price] >= 0"));
        builder.ToTable(t => t.HasCheckConstraint("CK_Products_Stock", "[Stock] >= 0"));
        builder.ToTable(t => t.HasCheckConstraint("CK_Products_MinimumStock", "[MinimumStock] >= 0"));

        builder.HasIndex(x => x.Slug).IsUnique().HasFilter("[Slug] IS NOT NULL");
        builder.HasIndex(x => x.CategoryId);
        builder.HasIndex(x => x.IsActive);

        builder.HasOne(x => x.Category)
            .WithMany(x => x.Products)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
