using TicketGo.Api.DTOs.EventTicketTypes;

namespace TicketGo.Api.Interfaces.Services;

public interface IEventTicketTypeService
{
    Task<List<EventTicketTypeResponseDto>> GetByEventIdAsync(Guid eventId);

    Task<EventTicketTypeResponseDto> CreateAsync(CreateEventTicketTypeDto request);

    Task<EventTicketTypeResponseDto> UpdateAsync(Guid id, UpdateEventTicketTypeDto request);

    Task DeleteAsync(Guid id);
}