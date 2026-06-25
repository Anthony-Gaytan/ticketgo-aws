namespace TicketGo.Api.DTOs.EventTicketTypes;

public class CreateEventTicketTypeDto
{
    public Guid EventId { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public int Stock { get; set; }
}