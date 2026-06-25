namespace TicketGo.Api.Entities;

public class Event
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime EventDate { get; set; }

    public string Location { get; set; } = string.Empty;

    public decimal Price { get; set; }

    // Relación 1:N -> Un evento puede tener muchos tickets
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}