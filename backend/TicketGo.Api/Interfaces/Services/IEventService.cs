using System.Security.Claims;
using TicketGo.Api.DTOs.Events;

namespace TicketGo.Api.Interfaces.Services;

public interface IEventService
{
    Task<List<EventResponseDto>> GetAllAsync(ClaimsPrincipal? user = null);

    Task<EventResponseDto> GetByIdAsync(Guid id, ClaimsPrincipal? user = null);

    Task<EventResponseDto> CreateAsync(CreateEventDto request, ClaimsPrincipal user);

    Task<EventResponseDto> UpdateAsync(Guid id, UpdateEventDto request, ClaimsPrincipal user);

    Task DeleteAsync(Guid id, ClaimsPrincipal user);

    Task<EventResponseDto> PublishAsync(Guid id, ClaimsPrincipal user);

    Task<EventResponseDto> CancelAsync(Guid id, ClaimsPrincipal user);
}