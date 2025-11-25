using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using Saga.Server.Models;

#nullable disable

namespace Saga.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddYorumReplies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "ust_yorum_id",
                table: "yorumlar",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_yorumlar_ust_yorum_id",
                table: "yorumlar",
                column: "ust_yorum_id");

            migrationBuilder.AddForeignKey(
                name: "FK_yorumlar_yorumlar_ust_yorum_id",
                table: "yorumlar",
                column: "ust_yorum_id",
                principalTable: "yorumlar",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_yorumlar_yorumlar_ust_yorum_id",
                table: "yorumlar");

            migrationBuilder.DropIndex(
                name: "IX_yorumlar_ust_yorum_id",
                table: "yorumlar");

            migrationBuilder.DropColumn(
                name: "ust_yorum_id",
                table: "yorumlar");
        }
    }
}
