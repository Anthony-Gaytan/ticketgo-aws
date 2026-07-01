using System.Security.Claims;
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

    public async Task<List<EventResponseDto>> GetAllAsync()
    {
        return await _context.Events
            .Where(e => !e.IsDeleted)
            .Select(e => MapToResponse(e))
            .ToListAsync();
    }

    public async Task<EventResponseDto> GetByIdAsync(Guid id)
    {
        var existingEvent = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (existingEvent == null)
            throw new KeyNotFoundException("Evento no encontrado.");

        return MapToResponse(existingEvent);
    }

    public async Task<EventResponseDto> CreateAsync(CreateEventDto request, ClaimsPrincipal user)
    {
        var organizerId = GetUserIdFromClaims(user);

        ValidateEventDatesAndCapacity(request.StartDate, request.EndDate, request.Capacity);

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
            Status = !string.IsNullOrWhiteSpace(request.Status) ? request.Status : "Draft",
            ImageUrl = request.ImageUrl,
            CreatedAt = DateTime.UtcNow
        };

        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync();

        return MapToResponse(newEvent);
    }

    public async Task<EventResponseDto> UpdateAsync(Guid id, UpdateEventDto request, ClaimsPrincipal user)
    {
        var existingEvent = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (existingEvent == null)
            throw new KeyNotFoundException("Evento no encontrado.");

        ValidateEventDatesAndCapacity(request.StartDate, request.EndDate, request.Capacity);

        if (existingEvent.Status == "Cancelled")
            throw new InvalidOperationException("No se puede editar un evento cancelado.");

        if (existingEvent.TicketsSold > request.Capacity)
            throw new InvalidOperationException("La nueva capacidad no puede ser menor a los tickets vendidos.");

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

        return MapToResponse(existingEvent);
    }

    public async Task DeleteAsync(Guid id, ClaimsPrincipal user)
    {
        var existingEvent = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (existingEvent == null)
            throw new KeyNotFoundException("Evento no encontrado.");

        if (existingEvent.TicketsSold > 0)
            throw new InvalidOperationException("No se puede eliminar un evento con tickets vendidos.");

        existingEvent.IsDeleted = true;
        existingEvent.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task<EventResponseDto> PublishAsync(Guid id, ClaimsPrincipal user)
    {
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

        return MapToResponse(existingEvent);
    }

    public async Task<EventResponseDto> CancelAsync(Guid id, ClaimsPrincipal user)
    {
        var existingEvent = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (existingEvent == null)
            throw new KeyNotFoundException("Evento no encontrado.");

        if (existingEvent.Status == "Finished")
            throw new InvalidOperationException("No se puede cancelar un evento finalizado.");

        existingEvent.Status = "Cancelled";
        existingEvent.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(existingEvent);
    }

    private static EventResponseDto MapToResponse(Event e)
    {
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
            CreatedAt = e.CreatedAt
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