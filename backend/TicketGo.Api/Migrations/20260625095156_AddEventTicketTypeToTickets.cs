using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TicketGo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEventTicketTypeToTickets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "EventTicketTypeId",
                table: "Tickets",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_EventTicketTypeId",
                table: "Tickets",
                column: "EventTicketTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_EventTicketTypes_EventTicketTypeId",
                table: "Tickets",
                column: "EventTicketTypeId",
                principalTable: "EventTicketTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_EventTicketTypes_EventTicketTypeId",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_EventTicketTypeId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "EventTicketTypeId",
                table: "Tickets");
        }
    }
}
