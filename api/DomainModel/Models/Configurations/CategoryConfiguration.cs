using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> e)
    {
        e.Property(c => c.Name).HasMaxLength(100).IsRequired();
        e.Property(c => c.Description).HasMaxLength(500);
        e.Property(c => c.Slug).HasMaxLength(150);
        e.Property(c => c.MetaTitle).HasMaxLength(200);
        e.Property(c => c.MetaDescription).HasMaxLength(500);
        e.Property(c => c.MetaKeywords).HasMaxLength(500);
        e.Property(c => c.CanonicalUrl).HasMaxLength(500);
        e.Property(c => c.OgTitle).HasMaxLength(200);
        e.Property(c => c.OgDescription).HasMaxLength(500);
        e.HasIndex(c => c.Slug);
        e.HasIndex(c => new { c.ParentId, c.SortOrder });

        e.HasOne(c => c.ImageFile)
            .WithMany()
            .HasForeignKey(c => c.ImageFileId)
            .OnDelete(DeleteBehavior.SetNull);

        e.HasOne(c => c.OgImage)
            .WithMany()
            .HasForeignKey(c => c.OgImageId)
            .OnDelete(DeleteBehavior.NoAction);

        e.HasOne(c => c.Parent)
            .WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
