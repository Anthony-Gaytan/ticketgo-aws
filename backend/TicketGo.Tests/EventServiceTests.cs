using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.Events;
using TicketGo.Api.Entities;
using TicketGo.Api.Services;
using Xunit;

namespace TicketGo.Tests;

public class EventServiceTests
{
    private TicketGoDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<TicketGoDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new TicketGoDbContext(options);
    }

    private ClaimsPrincipal CreatePrincipal(Guid userId, string role, string email = "")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Name, "User Test")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        return new ClaimsPrincipal(identity);
    }

    [Fact]
    public async Task CreateAsync_WhenUserIsOrganizer_ShouldForcePendingReviewStatus()
    {
        // Arrange
        var context = GetDbContext();
        var service = new EventService(context);
        var organizerId = Guid.NewGuid();
        var userPrincipal = CreatePrincipal(organizerId, "Organizer");

        var request = new CreateEventDto
        {
            Title = "Organizer Test Event",
            Description = "A description",
            Venue = "Virtual",
            StartDate = DateTime.UtcNow.AddDays(5),
            EndDate = DateTime.UtcNow.AddDays(6),
            Capacity = 100,
            Status = "Published" // Client attempts to publish directly
        };

        // Act
        var result = await service.CreateAsync(request, userPrincipal);

        // Assert
        result.Status.Should().Be("PendingReview");
        var dbEvent = await context.Events.FirstAsync(e => e.Id == result.Id);
        dbEvent.Status.Should().Be("PendingReview");
        dbEvent.OrganizerId.Should().Be(organizerId);
    }

    [Fact]
    public async Task CancelAsync_WhenEventHasCommercialActivity_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var context = GetDbContext();
        var adminPrincipal = CreatePrincipal(Guid.NewGuid(), "Admin");
        
        var @event = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Sold Event",
            Description = "Sold out",
            Venue = "Stadium",
            StartDate = DateTime.UtcNow.AddDays(2),
            Capacity = 100,
            Status = "Published",
            TicketsSold = 5 // Has sales
        };
        context.Events.Add(@event);
        await context.SaveChangesAsync();

        var service = new EventService(context);

        // Act
        Func<Task> act = async () => await service.CancelAsync(@event.Id, adminPrincipal);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("No se puede cancelar el evento porque ya tiene entradas vendidas.");
    }

    [Fact]
    public async Task DeleteAsync_WhenEventHasCommercialActivity_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var context = GetDbContext();
        
        var @event = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Sold Event to Delete",
            Description = "Some description",
            Venue = "Stadium",
            StartDate = DateTime.UtcNow.AddDays(2),
            Capacity = 100,
            Status = "Published",
            TicketsSold = 0
        };
        context.Events.Add(@event);

        // Add a ticket to trigger db-level sales validation
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            EventId = @event.Id,
            EventTicketTypeId = Guid.NewGuid(),
            Code = "XYZ",
            Status = "Issued",
            HolderEmail = "test@customer.com",
            HolderName = "Test"
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        var service = new EventService(context);
        var adminPrincipal = CreatePrincipal(Guid.NewGuid(), "Admin");

        // Act
        Func<Task> act = async () => await service.DeleteAsync(@event.Id, adminPrincipal);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("No se puede eliminar el evento porque ya tiene entradas vendidas o actividad comercial.");
    }

    [Fact]
    public async Task UpdateAsync_WhenOrganizerAttemptsToPublishDirectly_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var context = GetDbContext();
        var organizerId = Guid.NewGuid();
        var userPrincipal = CreatePrincipal(organizerId, "Organizer");

        var @event = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Draft Event",
            Description = "A description",
            Venue = "Venue",
            StartDate = DateTime.UtcNow.AddDays(2),
            Capacity = 100,
            Status = "Draft",
            OrganizerId = organizerId
        };
        context.Events.Add(@event);
        await context.SaveChangesAsync();

        var service = new EventService(context);
        var request = new UpdateEventDto
        {
            Title = "Updated Draft Event",
            Description = "Updated description",
            Venue = "Venue",
            StartDate = DateTime.UtcNow.AddDays(2),
            Capacity = 100,
            Status = "Published" // Organizer tries to publish on update
        };

        // Act
        Func<Task> act = async () => await service.UpdateAsync(@event.Id, request, userPrincipal);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Un Organizador no puede publicar eventos directamente.");
    }

    [Fact]
    public async Task UpdateAsync_WhenOrganizerAttemptsToEditPublishedEvent_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var context = GetDbContext();
        var organizerId = Guid.NewGuid();
        var userPrincipal = CreatePrincipal(organizerId, "Organizer");

        var @event = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Published Event",
            Description = "A description",
            Venue = "Venue",
            StartDate = DateTime.UtcNow.AddDays(2),
            Capacity = 100,
            Status = "Published",
            OrganizerId = organizerId
        };
        context.Events.Add(@event);
        await context.SaveChangesAsync();

        var service = new EventService(context);
        var request = new UpdateEventDto
        {
            Title = "Updated Published Event",
            Description = "Updated description",
            Venue = "Venue",
            StartDate = DateTime.UtcNow.AddDays(2),
            Capacity = 100,
            Status = "Published"
        };

        // Act
        Func<Task> act = async () => await service.UpdateAsync(@event.Id, request, userPrincipal);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("No se puede editar el evento en su estado actual: Published.");
    }
}
