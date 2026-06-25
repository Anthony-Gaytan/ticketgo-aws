namespace TicketGo.Api.Entities;

public class OrderDetail
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }

    public Order Order { get; set; } = null!;

    public Guid EventTicketTypeId { get; set; }

    public EventTicketType EventTicketType { get; set; } = null!;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Subtotal { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}