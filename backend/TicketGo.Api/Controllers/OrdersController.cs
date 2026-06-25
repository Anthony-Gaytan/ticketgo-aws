using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketGo.Api.DTOs.Orders;
using TicketGo.Api.Interfaces.Services;

namespace TicketGo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var orders = await _orderService.GetAllAsync();
        return Ok(orders);
    }

    [HttpPost("purchase")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> Purchase([FromBody] PurchaseRequestDto request)
    {
        var result = await _orderService.PurchaseAsync(request, User);
        return Ok(result);
    }
}