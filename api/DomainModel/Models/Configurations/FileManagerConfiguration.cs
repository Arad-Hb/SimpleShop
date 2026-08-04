using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class FileManagerConfiguration : IEntityTypeConfiguration<FileManager>
{
    public void Configure(EntityTypeBuilder<FileManager> e)
    {
        e.ToTable("FileManagers");
        e.Property(x => x.FileName).HasMaxLength(260).IsRequired();
        e.Property(x => x.OriginalFileName).HasMaxLength(260).IsRequired();
        e.Property(x => x.Url).HasMaxLength(500).IsRequired();
        e.Property(x => x.ThumbnailUrl).HasMaxLength(500).IsRequired();
        e.Property(x => x.MimeType).HasMaxLength(100).IsRequired();
        e.Property(x => x.AltText).HasMaxLength(300);
        e.Property(x => x.SourceUrl).HasMaxLength(1000);
        e.Property(x => x.Folder).HasMaxLength(50).IsRequired();
        e.HasIndex(x => x.Folder);
    }
}
