using Microsoft.AspNetCore.Mvc;

namespace TicketGo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok("TicketGo API OK");
    }
}