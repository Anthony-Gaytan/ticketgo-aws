using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.Tickets;
using TicketGo.Api.Entities;
using TicketGo.Api.Interfaces.Services;

namespace TicketGo.Api.Services;

public class TicketService : ITicketService
{
    private readonly TicketGoDbContext _context;

    public TicketService(TicketGoDbContext context)
    {
        _context = context;
    }

    public async Task<List<TicketResponseDto>> GetAllAsync()
    {
        return await _context.Tickets
            .Include(t => t.Event)
            .Include(t => t.EventTicketType)
            .Select(t => MapToResponse(t))
            .ToListAsync();
    }

    public async Task<List<TicketResponseDto>> GetMyTicketsAsync(ClaimsPrincipal user)
    {
        var userId = GetUserIdFromClaims(user);

        return await _context.Tickets
            .Include(t => t.Event)
            .Include(t => t.EventTicketType)
            .Include(t => t.Order)
            .Where(t => t.Order != null && t.Order.UserId == userId)
            .Select(t => MapToResponse(t))
            .ToListAsync();
    }

    public async Task<TicketResponseDto> ValidateAsync(ValidateTicketRequestDto request, ClaimsPrincipal user)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Event)
            .Include(t => t.EventTicketType)
            .FirstOrDefaultAsync(t => t.Code == request.Code);

        if (ticket == null)
            throw new KeyNotFoundException("Ticket no encontrado.");

        if (ticket.Status == "Cancelled")
            throw new InvalidOperationException("El ticket está cancelado.");

        if (ticket.IsUsed || ticket.Status == "Used")
            throw new InvalidOperationException("El ticket ya fue utilizado.");

        if (ticket.Event.Status != "Published")
            throw new InvalidOperationException("El evento no está activo para validación.");

        ticket.IsUsed = true;
        ticket.Status = "Used";
        ticket.UsedAt = DateTime.UtcNow;
        ticket.CheckedBy = user.FindFirst(ClaimTypes.Email)?.Value ?? "Sistema";

        await _context.SaveChangesAsync();

        return MapToResponse(ticket);
    }

    private static TicketResponseDto MapToResponse(Ticket ticket)
    {
        return new TicketResponseDto
        {
            Id = ticket.Id,
            EventId = ticket.EventId,
            EventTitle = ticket.Event.Title,
            EventTicketTypeId = ticket.EventTicketTypeId,
            TicketTypeName = ticket.EventTicketType.Name,
            OrderId = ticket.OrderId,
            Code = ticket.Code,
            QRCode = ticket.QRCode,
            Status = ticket.Status,
            IssuedAt = ticket.IssuedAt,
            UsedAt = ticket.UsedAt,
            CheckedBy = ticket.CheckedBy,
            HolderName = ticket.HolderName,
            HolderEmail = ticket.HolderEmail,
            IsUsed = ticket.IsUsed
        };
    }

    private static Guid GetUserIdFromClaims(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(userIdClaim))
            throw new UnauthorizedAccessException("Token inválido.");

        return Guid.Parse(userIdClaim);
    }
}