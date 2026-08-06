using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DomainModel.Models.Configurations;

public class ApplicationRoleConfiguration : IEntityTypeConfiguration<ApplicationRole>
{
    public void Configure(EntityTypeBuilder<ApplicationRole> builder)
    {
        builder.Property(x => x.Description).HasMaxLength(200);

        builder.HasMany(x => x.ApplicationUserRoles)
            .WithOne(x => x.ApplicationRole)
            .HasForeignKey(x => x.ApplicationRoleID);
    }
}
