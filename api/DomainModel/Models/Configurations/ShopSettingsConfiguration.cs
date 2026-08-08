using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class ShopSettingsConfiguration : IEntityTypeConfiguration<ShopSettings>
{
    public void Configure(EntityTypeBuilder<ShopSettings> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ShopName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.ShopDescription).HasMaxLength(1000);
        builder.Property(x => x.ContactPhone).HasMaxLength(20);
        builder.Property(x => x.ContactEmail).HasMaxLength(100);
        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.Currency).HasMaxLength(20);
        builder.Property(x => x.ShopVisibility).HasMaxLength(20);
        builder.Property(x => x.Instagram).HasMaxLength(200);
        builder.Property(x => x.Telegram).HasMaxLength(200);
        builder.Property(x => x.Whatsapp).HasMaxLength(200);
        builder.Property(x => x.DefaultSeoTitle).HasMaxLength(200);
        builder.Property(x => x.DefaultSeoDescription).HasMaxLength(500);
    }
}
