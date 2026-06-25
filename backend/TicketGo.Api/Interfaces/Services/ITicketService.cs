using System.Security.Claims;
using TicketGo.Api.DTOs.Tickets;

namespace TicketGo.Api.Interfaces.Services;

public interface ITicketService
{
    Task<List<TicketResponseDto>> GetAllAsync();

    Task<List<TicketResponseDto>> GetMyTicketsAsync(ClaimsPrincipal user);

    Task<TicketResponseDto> ValidateAsync(ValidateTicketRequestDto request, ClaimsPrincipal user);
}