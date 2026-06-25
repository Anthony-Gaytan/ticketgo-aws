namespace TicketGo.Api.DTOs.EventTicketTypes;

public class EventTicketTypeResponseDto
{
    public Guid Id { get; set; }

    public Guid EventId { get; set; }

    public string EventTitle { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public int Stock { get; set; }

    public int SoldQuantity { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }
}