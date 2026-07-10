using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.Events;
using TicketGo.Api.Entities;
using TicketGo.Api.Interfaces.Services;

namespace TicketGo.Api.Services;

public class EventService : IEventService
{
    private readonly TicketGoDbContext _context;

    public EventService(TicketGoDbContext context)
    {
        _context = context;
    }

    public async Task<List<EventResponseDto>> GetAllAsync(ClaimsPrincipal? user = null)
    {
        var events = await _context.Events
            .Where(e => !e.IsDeleted)
            .ToListAsync();

        var response = new List<EventResponseDto>();
        foreach (var ev in events)
        {
            response.Add(await MapToResponseAsync(ev, user));
        }

        return response;
    }

    public async Task<EventResponseDto> GetByIdAsync(Guid id, ClaimsPrincipal? user = null)
    {
        var existingEvent = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (existingEvent == null)
            throw new KeyNotFoundException("Evento no encontrado.");

        return await MapToResponseAsync(existingEvent, user);
    }

    public async Task<EventResponseDto> CreateAsync(CreateEventDto request, ClaimsPrincipal user)
    {
        var organizerId = GetUserIdFromClaims(user);
        var userRole = user.FindFirst(ClaimTypes.Role)?.Value;

        ValidateEventDatesAndCapacity(request.StartDate, request.EndDate, request.Capacity);

        var status = !string.IsNullOrWhiteSpace(request.Status) ? request.Status : "Draft";
        if (userRole == "Organizer")
        {
            status = "PendingReview"; // Force PendingReview for organizers
        }

        var newEvent = new Event
        {
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            Venue = request.Venue,
            Address = request.Address,
            City = request.City,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Capacity = request.Capacity,
            OrganizerId = organizerId,
            Status = status,
            ImageUrl = request.ImageUrl,
            CreatedAt = DateTime.UtcNow
        };

        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync();

        return await MapToResponseAsync(newEvent, user);
    }

    public async Task<EventResponseDto> UpdateAsync(Guid id, UpdateEventDto request, ClaimsPrincipal user)
    {
        var existingEvent = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (existingEvent == null)
            throw new KeyNotFoundException("Evento no encontrado.");

        var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
        var userId = GetUserIdFromClaims(user);

        // Organizer specific rules
        if (userRole == "Organizer")
        {
            if (existingEvent.OrganizerId != userId)
                throw new UnauthorizedAccessException("No tienes permisos para editar este evento.");

            var editableStatuses = new[] { "Draft", "PendingReview", "Rejected", "OnHold" };
            if (!editableStatuses.Contains(existingEvent.Status))
                throw new InvalidOperationException($"No se puede editar el evento en su estado actual: {existingEvent.Status}.");

            if (request.Status == "Published")
                throw new InvalidOperationException("Un Organizador no puede publicar eventos directamente.");
        }

        ValidateEventDatesAndCapacity(request.StartDate, request.EndDate, request.Capacity);

        if (existingEvent.Status == "Cancelled")
            throw new InvalidOperationException("No se puede editar un evento cancelado.");

        if (existingEvent.TicketsSold > request.Capacity)
            throw new InvalidOperationException("La nueva capacidad no puede ser menor a los tickets vendidos.");

        // If the request attempts to transition to Cancelled
        if (request.Status == "Cancelled" && await HasCommercialActivityAsync(id))
        {
            throw new InvalidOperationException("No se puede cancelar el evento porque ya tiene entradas vendidas.");
        }

        existingEvent.Title = request.Title;
        existingEvent.Description = request.Description;
        existingEvent.Category = request.Category;
        existingEvent.Venue = request.Venue;
        existingEvent.Address = request.Address;
        existingEvent.City = request.City;
        existingEvent.StartDate = request.StartDate;
        existingEvent.EndDate = request.EndDate;
        existingEvent.Capacity = request.Capacity;
        existingEvent.ImageUrl = request.ImageUrl;
        
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            existingEvent.Status = request.Status;
        }
        
        existingEvent.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await MapToResponseAsync(existingEvent, user);
    }

    public async Task DeleteAsync(Guid id, ClaimsPrincipal user)
    {
        var existingEvent = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (existingEvent == null)
            throw new KeyNotFoundException("Evento no encontrado.");

        var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
        var userId = GetUserIdFromClaims(user);

        if (userRole == "Organizer" && existingEvent.OrganizerId != userId)
            throw new UnauthorizedAccessException("No tienes permisos para eliminar este evento.");

        if (await HasCommercialActivityAsync(id))
            throw new InvalidOperationException("No se puede eliminar el evento porque ya tiene entradas vendidas o actividad comercial.");

        existingEvent.IsDeleted = true;
        existingEvent.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task<EventResponseDto> PublishAsync(Guid id, ClaimsPrincipal user)
    {
        var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Admin")
            throw new UnauthorizedAccessException("Solo los Administradores pueden publicar eventos.");

        var existingEvent = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (existingEvent == null)
            throw new KeyNotFoundException("Evento no encontrado.");

        if (existingEvent.Status != "Draft" && existingEvent.Status != "PendingReview" && existingEvent.Status != "OnHold")
            throw new InvalidOperationException("Solo se pueden publicar eventos en estado Draft, PendingReview o OnHold.");

        if (existingEvent.StartDate <= DateTime.UtcNow)
            throw new InvalidOperationException("No se puede publicar un evento con fecha pasada.");

        existingEvent.Status = "Published";
        existingEvent.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await MapToResponseAsync(existingEvent, user);
    }

    public async Task<EventResponseDto> CancelAsync(Guid id, ClaimsPrincipal user)
    {
        var existingEvent = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (existingEvent == null)
            throw new KeyNotFoundException("Evento no encontrado.");

        var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
        var userId = GetUserIdFromClaims(user);

        if (userRole == "Organizer" && existingEvent.OrganizerId != userId)
            throw new UnauthorizedAccessException("No tienes permisos para cancelar este evento.");

        if (existingEvent.Status == "Finished")
            throw new InvalidOperationException("No se puede cancelar un evento finalizado.");

        if (await HasCommercialActivityAsync(id))
            throw new InvalidOperationException("No se puede cancelar el evento porque ya tiene entradas vendidas.");

        existingEvent.Status = "Cancelled";
        existingEvent.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await MapToResponseAsync(existingEvent, user);
    }

    private async Task<bool> HasCommercialActivityAsync(Guid eventId)
    {
        // 1. Check if tickets sold is > 0 on entity
        var ev = await _context.Events.FirstOrDefaultAsync(e => e.Id == eventId);
        if (ev != null && ev.TicketsSold > 0) return true;

        // 2. Check if there are tickets generated for the event
        var hasTickets = await _context.Tickets.AnyAsync(t => t.EventId == eventId);
        if (hasTickets) return true;

        // 3. Check if there are order details associated with the event's ticket types
        var hasOrderDetails = await _context.OrderDetails
            .AnyAsync(od => od.EventTicketType.EventId == eventId);
        if (hasOrderDetails) return true;

        return false;
    }

    private async Task<EventResponseDto> MapToResponseAsync(Event e, ClaimsPrincipal? user = null)
    {
        var hasActivity = await HasCommercialActivityAsync(e.Id);
        
        var canCancel = e.Status != "Cancelled" && e.Status != "Finished" && !hasActivity;
        var canDelete = !hasActivity;
        
        bool canEdit = false;
        bool canPublish = false;
        
        if (user != null)
        {
            var userRole = user.FindFirst(ClaimTypes.Role)?.Value;
            var userIdStr = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userRole == "Admin")
            {
                canEdit = e.Status != "Cancelled" && e.Status != "Finished";
                canPublish = e.Status == "Draft" || e.Status == "PendingReview" || e.Status == "OnHold";
            }
            else if (userRole == "Organizer" && Guid.TryParse(userIdStr, out var userId))
            {
                canEdit = e.OrganizerId == userId && 
                           (e.Status == "Draft" || e.Status == "PendingReview" || e.Status == "Rejected" || e.Status == "OnHold");
                canPublish = false; // Organizers cannot publish directly
            }
        }

        return new EventResponseDto
        {
            Id = e.Id,
            Title = e.Title,
            Description = e.Description,
            Category = e.Category,
            Venue = e.Venue,
            Address = e.Address,
            City = e.City,
            StartDate = e.StartDate,
            EndDate = e.EndDate,
            Capacity = e.Capacity,
            TicketsSold = e.TicketsSold,
            Status = e.Status,
            OrganizerId = e.OrganizerId,
            ImageUrl = e.ImageUrl,
            CreatedAt = e.CreatedAt,
            HasCommercialActivity = hasActivity,
            CanCancel = canCancel,
            CanDelete = canDelete,
            CanEdit = canEdit,
            CanPublish = canPublish
        };
    }

    private static Guid GetUserIdFromClaims(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(userIdClaim))
            throw new UnauthorizedAccessException("Token inválido.");

        return Guid.Parse(userIdClaim);
    }

    private static void ValidateEventDatesAndCapacity(DateTime startDate, DateTime endDate, int capacity)
    {
        if (startDate <= DateTime.UtcNow)
            throw new InvalidOperationException("La fecha de inicio del evento no puede ser pasada.");

        if (endDate <= startDate)
            throw new InvalidOperationException("La fecha de fin debe ser mayor a la fecha de inicio.");

        if (capacity <= 0)
            throw new InvalidOperationException("La capacidad debe ser mayor a cero.");
    }
}