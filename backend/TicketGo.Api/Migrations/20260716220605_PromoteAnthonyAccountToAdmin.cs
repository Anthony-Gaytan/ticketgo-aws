using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TicketGo.Api.Migrations
{
    /// <inheritdoc />
    public partial class PromoteAnthonyAccountToAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE \"Users\" SET \"Role\" = 'Admin' WHERE LOWER(\"Email\") = LOWER('Gaytan150518@gmail.com');");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE \"Users\" SET \"Role\" = 'Customer' WHERE LOWER(\"Email\") = LOWER('Gaytan150518@gmail.com');");
        }
    }
}
