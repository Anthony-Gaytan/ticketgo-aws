namespace TicketGo.Api.DTOs.Orders;

public class OrderResponseDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderTicketDto> Tickets { get; set; } = new();
}

public class OrderTicketDto
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public string Code { get; set; } = string.Empty;
    public bool IsUsed { get; set; }
}