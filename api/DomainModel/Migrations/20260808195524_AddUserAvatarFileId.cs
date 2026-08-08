using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DomainModel.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAvatarFileId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AvatarFileId",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_AvatarFileId",
                table: "AspNetUsers",
                column: "AvatarFileId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_FileManagers_AvatarFileId",
                table: "AspNetUsers",
                column: "AvatarFileId",
                principalTable: "FileManagers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_FileManagers_AvatarFileId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_AvatarFileId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "AvatarFileId",
                table: "AspNetUsers");
        }
    }
}
