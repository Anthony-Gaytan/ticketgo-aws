using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.Orders;
using TicketGo.Api.Entities;
using TicketGo.Api.Interfaces.Services;

namespace TicketGo.Api.Services;

public class OrderService : IOrderService
{
    private readonly TicketGoDbContext _context;
    private readonly IQrService _qrService;

    public OrderService(
        TicketGoDbContext context,
        IQrService qrService)
    {
        _context = context;
        _qrService = qrService;
    }

    public async Task<List<OrderResponseDto>> GetAllAsync()
    {
        return await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Tickets)
            .Select(o => new OrderResponseDto
            {
                Id = o.Id,
                UserId = o.UserId,
                UserFullName = o.User.FullName,
                Total = o.Total,
                CreatedAt = o.CreatedAt,
                Tickets = o.Tickets.Select(t => new OrderTicketDto
                {
                    Id = t.Id,
                    EventId = t.EventId,
                    Code = t.Code,
                    IsUsed = t.IsUsed
                }).ToList()
            })
            .ToListAsync();
    }

    public async Task<PurchaseResponseDto> PurchaseAsync(PurchaseRequestDto request, ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(userIdClaim))
            throw new UnauthorizedAccessException("Token inválido.");

        var userId = Guid.Parse(userIdClaim);

        if (request.Quantity <= 0)
            throw new InvalidOperationException("La cantidad debe ser mayor a cero.");

        if (request.Quantity > 10)
            throw new InvalidOperationException("No se pueden comprar más de 10 entradas por operación.");

        var ticketType = await _context.EventTicketTypes
            .Include(tt => tt.Event)
            .FirstOrDefaultAsync(tt => tt.Id == request.EventTicketTypeId);

        if (ticketType == null)
            throw new KeyNotFoundException("Tipo de entrada no encontrado.");

        if (!ticketType.IsActive)
            throw new InvalidOperationException("Este tipo de entrada no está activo.");

        if (ticketType.Event.IsDeleted)
            throw new InvalidOperationException("El evento no está disponible.");

        if (ticketType.Event.Status != "Published")
            throw new InvalidOperationException("Solo se pueden comprar entradas de eventos publicados.");

        var availableStock = ticketType.Stock - ticketType.SoldQuantity;

        if (availableStock < request.Quantity)
            throw new InvalidOperationException("Stock insuficiente.");

        var total = ticketType.Price * request.Quantity;

        var order = new Order
        {
            UserId = userId,
            Total = total,
            CreatedAt = DateTime.UtcNow
        };

        _context.Orders.Add(order);

        var detail = new OrderDetail
        {
            Order = order,
            EventTicketTypeId = ticketType.Id,
            Quantity = request.Quantity,
            UnitPrice = ticketType.Price,
            Subtotal = total,
            CreatedAt = DateTime.UtcNow
        };

        _context.OrderDetails.Add(detail);

        ticketType.SoldQuantity += request.Quantity;
        ticketType.Event.TicketsSold += request.Quantity;

        var ticketCodes = new List<string>();

        for (var i = 0; i < request.Quantity; i++)
        {
            var ticketCode = Guid.NewGuid().ToString("N");
            var qrContent = $"TICKETGO:{ticketCode}";

            var ticket = new Ticket
            {
                EventId = ticketType.EventId,
                EventTicketTypeId = ticketType.Id,
                Order = order,
                Code = ticketCode,
                QRCode = _qrService.GenerateQrBase64(qrContent),
                Status = "Issued",
                IssuedAt = DateTime.UtcNow,
                HolderName = user.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty,
                HolderEmail = user.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty,
                IsUsed = false
            };

            ticketCodes.Add(ticketCode);
            _context.Tickets.Add(ticket);
        }

        await _context.SaveChangesAsync();

        return new PurchaseResponseDto
        {
            OrderId = order.Id,
            Total = order.Total,
            Quantity = request.Quantity,
            TicketTypeName = ticketType.Name,
            TicketCodes = ticketCodes
        };
    }
}