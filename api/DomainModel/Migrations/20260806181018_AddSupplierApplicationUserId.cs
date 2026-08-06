using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomainModel.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplierApplicationUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApplicationUserId",
                table: "Suppliers",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_ApplicationUserId",
                table: "Suppliers",
                column: "ApplicationUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Suppliers_AspNetUsers_ApplicationUserId",
                table: "Suppliers",
                column: "ApplicationUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Suppliers_AspNetUsers_ApplicationUserId",
                table: "Suppliers");

            migrationBuilder.DropIndex(
                name: "IX_Suppliers_ApplicationUserId",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "ApplicationUserId",
                table: "Suppliers");
        }
    }
}
