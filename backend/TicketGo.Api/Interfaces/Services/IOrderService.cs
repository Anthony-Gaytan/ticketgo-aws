using System.Security.Claims;
using TicketGo.Api.DTOs.Orders;

namespace TicketGo.Api.Interfaces.Services;

public interface IOrderService
{
    Task<List<OrderResponseDto>> GetAllAsync();

    Task<PurchaseResponseDto> PurchaseAsync(PurchaseRequestDto request, ClaimsPrincipal user);
}