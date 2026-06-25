namespace TicketGo.Api.Entities;

public class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid EventId { get; set; }

    public Event Event { get; set; } = null!;

    public Guid EventTicketTypeId { get; set; }

    public EventTicketType EventTicketType { get; set; } = null!;

    public Guid? OrderId { get; set; }

    public Order? Order { get; set; }

    public string Code { get; set; } = Guid.NewGuid().ToString("N");

    public string? QRCode { get; set; }

    public string Status { get; set; } = "Issued";

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UsedAt { get; set; }

    public string? CheckedBy { get; set; }

    public string HolderName { get; set; } = string.Empty;

    public string HolderEmail { get; set; } = string.Empty;

    public bool IsUsed { get; set; } = false;
}