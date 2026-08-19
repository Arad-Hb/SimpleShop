using DomainModel.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500);
        builder.Property(x => x.Slug).HasMaxLength(160);
        builder.Property(x => x.MetaTitle).HasMaxLength(180);
        builder.Property(x => x.MetaDescription).HasMaxLength(320);
        builder.Property(x => x.ImagePath).HasMaxLength(500);
        builder.Property(x => x.ThumbnailPath).HasMaxLength(500);

        builder.HasIndex(x => x.Slug).IsUnique().HasFilter("[Slug] IS NOT NULL");
        builder.HasIndex(x => new { x.ParentId, x.SortOrder });

        builder.HasOne(x => x.Parent)
            .WithMany(x => x.Children)
            .HasForeignKey(x => x.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
