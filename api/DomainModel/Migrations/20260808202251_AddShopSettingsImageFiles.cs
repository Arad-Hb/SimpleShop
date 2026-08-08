using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomainModel.Migrations
{
    /// <inheritdoc />
    public partial class AddShopSettingsImageFiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FaviconFileId",
                table: "ShopSettings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LogoFileId",
                table: "ShopSettings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OgImageFileId",
                table: "ShopSettings",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShopSettings_FaviconFileId",
                table: "ShopSettings",
                column: "FaviconFileId");

            migrationBuilder.CreateIndex(
                name: "IX_ShopSettings_LogoFileId",
                table: "ShopSettings",
                column: "LogoFileId");

            migrationBuilder.CreateIndex(
                name: "IX_ShopSettings_OgImageFileId",
                table: "ShopSettings",
                column: "OgImageFileId");

            migrationBuilder.AddForeignKey(
                name: "FK_ShopSettings_FileManagers_FaviconFileId",
                table: "ShopSettings",
                column: "FaviconFileId",
                principalTable: "FileManagers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ShopSettings_FileManagers_LogoFileId",
                table: "ShopSettings",
                column: "LogoFileId",
                principalTable: "FileManagers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ShopSettings_FileManagers_OgImageFileId",
                table: "ShopSettings",
                column: "OgImageFileId",
                principalTable: "FileManagers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShopSettings_FileManagers_FaviconFileId",
                table: "ShopSettings");

            migrationBuilder.DropForeignKey(
                name: "FK_ShopSettings_FileManagers_LogoFileId",
                table: "ShopSettings");

            migrationBuilder.DropForeignKey(
                name: "FK_ShopSettings_FileManagers_OgImageFileId",
                table: "ShopSettings");

            migrationBuilder.DropIndex(
                name: "IX_ShopSettings_FaviconFileId",
                table: "ShopSettings");

            migrationBuilder.DropIndex(
                name: "IX_ShopSettings_LogoFileId",
                table: "ShopSettings");

            migrationBuilder.DropIndex(
                name: "IX_ShopSettings_OgImageFileId",
                table: "ShopSettings");

            migrationBuilder.DropColumn(
                name: "FaviconFileId",
                table: "ShopSettings");

            migrationBuilder.DropColumn(
                name: "LogoFileId",
                table: "ShopSettings");

            migrationBuilder.DropColumn(
                name: "OgImageFileId",
                table: "ShopSettings");
        }
    }
}
