namespace TicketGo.Api.Entities;

public class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid EventId { get; set; }

    public Event Event { get; set; } = null!;

    public Guid? OrderId { get; set; }

    public Order? Order { get; set; }

    public string Code { get; set; } = Guid.NewGuid().ToString("N");

    public bool IsUsed { get; set; } = false;
}