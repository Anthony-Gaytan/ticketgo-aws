using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Data;
using TicketGo.Api.Entities;

namespace TicketGo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly TicketGoDbContext _context;

    public TicketsController(TicketGoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tickets = await _context.Tickets
            .Include(t => t.Event)
            .Include(t => t.Order)
            .ToListAsync();

        return Ok(tickets);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest request)
    {
        var eventExists = await _context.Events.AnyAsync(e => e.Id == request.EventId);

        if (!eventExists)
        {
            return BadRequest($"No existe un evento con el Id: {request.EventId}");
        }

        var ticket = new Ticket
        {
            EventId = request.EventId,
            Code = Guid.NewGuid().ToString("N"),
            IsUsed = false
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        return Ok(ticket);
    }
}

public class CreateTicketRequest
{
    public Guid EventId { get; set; }
}