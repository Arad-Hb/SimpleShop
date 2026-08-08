using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomainModel.Migrations
{
    /// <inheritdoc />
    public partial class AddShopSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShopSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ShopName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ShopDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ContactPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ContactEmail = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Currency = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    LowStockThreshold = table.Column<int>(type: "int", nullable: false),
                    ShopVisibility = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Instagram = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Telegram = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Whatsapp = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    InstagramEnabled = table.Column<bool>(type: "bit", nullable: false),
                    TelegramEnabled = table.Column<bool>(type: "bit", nullable: false),
                    WhatsappEnabled = table.Column<bool>(type: "bit", nullable: false),
                    DefaultSeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DefaultSeoDescription = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShopSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShopSettings");
        }
    }
}
