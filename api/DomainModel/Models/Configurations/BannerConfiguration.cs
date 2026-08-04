using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class BannerConfiguration : IEntityTypeConfiguration<Banner>
{
    public void Configure(EntityTypeBuilder<Banner> e)
    {
        e.ToTable("Banners");
        e.Property(x => x.Title).HasMaxLength(200).IsRequired();
        e.Property(x => x.Subtitle).HasMaxLength(500);
        e.Property(x => x.ButtonText).HasMaxLength(100);
        e.Property(x => x.LinkUrl).HasMaxLength(500);
        e.Property(x => x.Placement).HasMaxLength(50).IsRequired();
        e.HasIndex(x => new { x.Placement, x.SortOrder });

        e.HasOne(x => x.FileManager)
            .WithMany()
            .HasForeignKey(x => x.FileManagerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
