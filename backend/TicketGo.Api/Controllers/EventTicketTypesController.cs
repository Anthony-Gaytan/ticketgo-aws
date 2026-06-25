using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketGo.Api.DTOs.EventTicketTypes;
using TicketGo.Api.Interfaces.Services;

namespace TicketGo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventTicketTypesController : ControllerBase
{
    private readonly IEventTicketTypeService _service;

    public EventTicketTypesController(IEventTicketTypeService service)
    {
        _service = service;
    }

    [HttpGet("event/{eventId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByEventId(Guid eventId)
    {
        var result = await _service.GetByEventIdAsync(eventId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> Create([FromBody] CreateEventTicketTypeDto request)
    {
        var result = await _service.CreateAsync(request);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEventTicketTypeDto request)
    {
        var result = await _service.UpdateAsync(id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}