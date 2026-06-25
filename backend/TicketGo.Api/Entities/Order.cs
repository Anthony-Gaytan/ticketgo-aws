namespace TicketGo.Api.Entities;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public decimal Total { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Relación 1:N -> Una orden puede tener varios tickets
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}