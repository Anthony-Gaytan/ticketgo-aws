using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.Orders;
using TicketGo.Api.Entities;

namespace TicketGo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly TicketGoDbContext _context;

    public OrdersController(TicketGoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var orders = await _context.Orders
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

        return Ok(orders);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);

        if (!userExists)
        {
            return BadRequest($"No existe un usuario con el Id: {request.UserId}");
        }

        var order = new Order
        {
            UserId = request.UserId,
            Total = request.Total,
            CreatedAt = DateTime.UtcNow
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return Ok(order);
    }

    [HttpPost("add-ticket")]
    public async Task<IActionResult> AddTicketToOrder([FromBody] AddTicketToOrderRequest request)
    {
        var order = await _context.Orders
            .Include(o => o.Tickets)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId);

        if (order == null)
        {
            return BadRequest($"No existe una orden con el Id: {request.OrderId}");
        }

        var ticket = await _context.Tickets
            .Include(t => t.Event)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId);

        if (ticket == null)
        {
            return BadRequest($"No existe un ticket con el Id: {request.TicketId}");
        }

        if (ticket.OrderId != null)
        {
            return BadRequest("Este ticket ya está asociado a una orden.");
        }

        ticket.OrderId = order.Id;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            Message = "Ticket agregado correctamente a la orden.",
            OrderId = order.Id,
            TicketId = ticket.Id,
            ticket.Event.Title,
            TicketCode = ticket.Code
        });
    }
}

public class CreateOrderRequest
{
    public Guid UserId { get; set; }
    public decimal Total { get; set; }
}

public class AddTicketToOrderRequest
{
    public Guid OrderId { get; set; }
    public Guid TicketId { get; set; }
}