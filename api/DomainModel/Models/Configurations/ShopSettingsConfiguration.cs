using DomainModel.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class ShopSettingsConfiguration : IEntityTypeConfiguration<ShopSettings>
{
    public void Configure(EntityTypeBuilder<ShopSettings> builder)
    {
        builder.ToTable("ShopSettings");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.StoreName).HasMaxLength(120).IsRequired();
        builder.Property(x => x.StoreDescription).HasMaxLength(500);
        builder.Property(x => x.ContactPhone).HasMaxLength(30);
        builder.Property(x => x.ContactEmail).HasMaxLength(120);
        builder.Property(x => x.Address).HasMaxLength(400);
        builder.Property(x => x.Currency).HasMaxLength(30).IsRequired();
        builder.Property(x => x.InstagramUrl).HasMaxLength(200);
        builder.Property(x => x.TelegramUrl).HasMaxLength(200);
        builder.Property(x => x.WhatsAppUrl).HasMaxLength(200);
        builder.Property(x => x.DefaultSeoTitle).HasMaxLength(180);
        builder.Property(x => x.DefaultSeoDescription).HasMaxLength(320);
        builder.Property(x => x.LogoPath).HasMaxLength(500);
        builder.Property(x => x.FaviconPath).HasMaxLength(500);
        builder.Property(x => x.HeroImagePath).HasMaxLength(500);
        builder.Property(x => x.HeroTitle).HasMaxLength(180);
        builder.Property(x => x.HeroSubtitle).HasMaxLength(320);
        builder.ToTable(t => t.HasCheckConstraint("CK_ShopSettings_LowStock", "[LowStockThreshold] >= 0"));
    }
}
