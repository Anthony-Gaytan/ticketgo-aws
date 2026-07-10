using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.Orders;
using TicketGo.Api.Entities;
using TicketGo.Api.Interfaces.Services;
using TicketGo.Api.Services;
using Xunit;

namespace TicketGo.Tests;

public class OrderServiceTests
{
    private TicketGoDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<TicketGoDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new TicketGoDbContext(options);
    }

    private ClaimsPrincipal CreatePrincipal(Guid userId, string name = "Customer User", string email = "customer@example.com")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, "Customer")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        return new ClaimsPrincipal(identity);
    }

    [Fact]
    public async Task PurchaseAsync_WithSufficientStock_ShouldDeductStockAndGenerateTicketAndQR()
    {
        // Arrange
        var context = GetDbContext();
        var qrMock = new Mock<IQrService>();
        qrMock.Setup(q => q.GenerateQrBase64(It.IsAny<string>()))
            .Returns("base64-qr-code-image-data");

        var @event = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Concert Test",
            Description = "A great concert",
            Venue = "Stadium",
            StartDate = DateTime.UtcNow.AddDays(10),
            Capacity = 200,
            Status = "Published",
            IsDeleted = false,
            TicketsSold = 0
        };
        context.Events.Add(@event);

        var ticketType = new EventTicketType
        {
            Id = Guid.NewGuid(),
            Event = @event,
            Name = "VIP",
            Price = 100,
            Stock = 50,
            SoldQuantity = 10,
            IsActive = true
        };
        context.EventTicketTypes.Add(ticketType);
        await context.SaveChangesAsync();

        var service = new OrderService(context, qrMock.Object);
        var userId = Guid.NewGuid();
        var userPrincipal = CreatePrincipal(userId);

        var request = new PurchaseRequestDto
        {
            EventTicketTypeId = ticketType.Id,
            Quantity = 2
        };

        // Act
        var result = await service.PurchaseAsync(request, userPrincipal);

        // Assert
        result.Should().NotBeNull();
        result.Quantity.Should().Be(2);
        result.Total.Should().Be(200); // 100 * 2
        result.TicketCodes.Should().HaveCount(2);

        // Verify stock deduction
        var dbTicketType = await context.EventTicketTypes.FirstAsync(tt => tt.Id == ticketType.Id);
        dbTicketType.SoldQuantity.Should().Be(12); // 10 + 2

        var dbEvent = await context.Events.FirstAsync(e => e.Id == @event.Id);
        dbEvent.TicketsSold.Should().Be(2);

        // Verify tickets and QRs generation
        var tickets = await context.Tickets.ToListAsync();
        tickets.Should().HaveCount(2);
        tickets[0].QRCode.Should().Be("base64-qr-code-image-data");
        tickets[0].HolderEmail.Should().Be("customer@example.com");
    }

    [Fact]
    public async Task PurchaseAsync_WithInsufficientStock_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var context = GetDbContext();
        var qrMock = new Mock<IQrService>();

        var @event = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Limited Test",
            Description = "Description",
            Venue = "Venue",
            StartDate = DateTime.UtcNow.AddDays(1),
            Capacity = 10,
            Status = "Published",
            IsDeleted = false
        };
        context.Events.Add(@event);

        var ticketType = new EventTicketType
        {
            Id = Guid.NewGuid(),
            Event = @event,
            Name = "General",
            Price = 20,
            Stock = 5,
            SoldQuantity = 4, // 1 ticket available
            IsActive = true
        };
        context.EventTicketTypes.Add(ticketType);
        await context.SaveChangesAsync();

        var service = new OrderService(context, qrMock.Object);
        var userPrincipal = CreatePrincipal(Guid.NewGuid());

        var request = new PurchaseRequestDto
        {
            EventTicketTypeId = ticketType.Id,
            Quantity = 2 // Demands 2, only 1 left
        };

        // Act
        Func<Task> act = async () => await service.PurchaseAsync(request, userPrincipal);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Stock insuficiente.");
    }
}
