namespace TicketGo.Api.DTOs.EventTicketTypes;

public class UpdateEventTicketTypeDto
{
    public string Name { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public int Stock { get; set; }

    public bool IsActive { get; set; }
}