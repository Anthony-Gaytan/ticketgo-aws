using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.EventTicketTypes;
using TicketGo.Api.Entities;
using TicketGo.Api.Interfaces.Services;

namespace TicketGo.Api.Services;

public class EventTicketTypeService : IEventTicketTypeService
{
    private readonly TicketGoDbContext _context;

    public EventTicketTypeService(TicketGoDbContext context)
    {
        _context = context;
    }

    public async Task<List<EventTicketTypeResponseDto>> GetByEventIdAsync(Guid eventId)
    {
        return await _context.EventTicketTypes
            .Include(tt => tt.Event)
            .Where(tt => tt.EventId == eventId)
            .Select(tt => MapToResponse(tt))
            .ToListAsync();
    }

    public async Task<EventTicketTypeResponseDto> CreateAsync(CreateEventTicketTypeDto request)
    {
        var eventExists = await _context.Events
            .AnyAsync(e => e.Id == request.EventId && !e.IsDeleted);

        if (!eventExists)
            throw new KeyNotFoundException("Evento no encontrado.");

        if (request.Price < 0)
            throw new InvalidOperationException("El precio no puede ser negativo.");

        if (request.Stock <= 0)
            throw new InvalidOperationException("El stock debe ser mayor a cero.");

        var ticketType = new EventTicketType
        {
            EventId = request.EventId,
            Name = request.Name,
            Price = request.Price,
            Stock = request.Stock,
            SoldQuantity = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventTicketTypes.Add(ticketType);
        await _context.SaveChangesAsync();

        await _context.Entry(ticketType)
            .Reference(tt => tt.Event)
            .LoadAsync();

        return MapToResponse(ticketType);
    }

    public async Task<EventTicketTypeResponseDto> UpdateAsync(Guid id, UpdateEventTicketTypeDto request)
    {
        var ticketType = await _context.EventTicketTypes
            .Include(tt => tt.Event)
            .FirstOrDefaultAsync(tt => tt.Id == id);

        if (ticketType == null)
            throw new KeyNotFoundException("Tipo de entrada no encontrado.");

        if (request.Price < 0)
            throw new InvalidOperationException("El precio no puede ser negativo.");

        if (request.Stock < ticketType.SoldQuantity)
            throw new InvalidOperationException("El stock no puede ser menor a la cantidad vendida.");

        ticketType.Name = request.Name;
        ticketType.Price = request.Price;
        ticketType.Stock = request.Stock;
        ticketType.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return MapToResponse(ticketType);
    }

    public async Task DeleteAsync(Guid id)
    {
        var ticketType = await _context.EventTicketTypes
            .FirstOrDefaultAsync(tt => tt.Id == id);

        if (ticketType == null)
            throw new KeyNotFoundException("Tipo de entrada no encontrado.");

        if (ticketType.SoldQuantity > 0)
            throw new InvalidOperationException("No se puede eliminar un tipo de entrada con ventas.");

        _context.EventTicketTypes.Remove(ticketType);
        await _context.SaveChangesAsync();
    }

    private static EventTicketTypeResponseDto MapToResponse(EventTicketType ticketType)
    {
        return new EventTicketTypeResponseDto
        {
            Id = ticketType.Id,
            EventId = ticketType.EventId,
            EventTitle = ticketType.Event.Title,
            Name = ticketType.Name,
            Price = ticketType.Price,
            Stock = ticketType.Stock,
            SoldQuantity = ticketType.SoldQuantity,
            IsActive = ticketType.IsActive,
            CreatedAt = ticketType.CreatedAt
        };
    }
}