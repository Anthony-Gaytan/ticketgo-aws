using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketGo.Api.DTOs.Tickets;
using TicketGo.Api.Interfaces.Services;

namespace TicketGo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    /// <summary>
    /// Lista todos los tickets.
    /// Solo Administradores.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var tickets = await _ticketService.GetAllAsync();
        return Ok(tickets);
    }

    /// <summary>
    /// Lista los tickets del usuario autenticado.
    /// </summary>
    [HttpGet("my-tickets")]
    [Authorize]
    public async Task<IActionResult> GetMyTickets()
    {
        var tickets = await _ticketService.GetMyTicketsAsync(User);
        return Ok(tickets);
    }

    /// <summary>
    /// Valida un ticket para permitir el ingreso al evento.
    /// </summary>
    [HttpPost("validate")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> Validate([FromBody] ValidateTicketRequestDto request)
    {
        var result = await _ticketService.ValidateAsync(request, User);
        return Ok(result);
    }
}