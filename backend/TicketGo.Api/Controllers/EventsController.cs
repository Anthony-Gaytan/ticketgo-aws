using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketGo.Api.DTOs.Events;
using TicketGo.Api.Interfaces.Services;

namespace TicketGo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var events = await _eventService.GetAllAsync(User);
        return Ok(events);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var eventDetail = await _eventService.GetByIdAsync(id, User);
        return Ok(eventDetail);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> Create([FromBody] CreateEventDto request)
    {
        var created = await _eventService.CreateAsync(request, User);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEventDto request)
    {
        var updated = await _eventService.UpdateAsync(id, request, User);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _eventService.DeleteAsync(id, User);
        return NoContent();
    }

    [HttpPatch("{id}/publish")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> Publish(Guid id)
    {
        var published = await _eventService.PublishAsync(id, User);
        return Ok(published);
    }

    [HttpPatch("{id}/cancel")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var cancelled = await _eventService.CancelAsync(id, User);
        return Ok(cancelled);
    }
}