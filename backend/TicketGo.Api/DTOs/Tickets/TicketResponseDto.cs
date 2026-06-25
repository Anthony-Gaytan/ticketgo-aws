namespace TicketGo.Api.DTOs.Tickets;

public class TicketResponseDto
{
    public Guid Id { get; set; }

    public Guid EventId { get; set; }

    public string EventTitle { get; set; } = string.Empty;

    public Guid EventTicketTypeId { get; set; }

    public string TicketTypeName { get; set; } = string.Empty;

    public Guid? OrderId { get; set; }

    public string Code { get; set; } = string.Empty;

    public string? QRCode { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime IssuedAt { get; set; }

    public DateTime? UsedAt { get; set; }

    public string? CheckedBy { get; set; }

    public string HolderName { get; set; } = string.Empty;

    public string HolderEmail { get; set; } = string.Empty;

    public bool IsUsed { get; set; }
}