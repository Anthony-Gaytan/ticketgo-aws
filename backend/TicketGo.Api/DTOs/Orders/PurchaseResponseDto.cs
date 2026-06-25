namespace TicketGo.Api.DTOs.Orders;

public class PurchaseResponseDto
{
    public Guid OrderId { get; set; }

    public decimal Total { get; set; }

    public int Quantity { get; set; }

    public string TicketTypeName { get; set; } = string.Empty;

    public List<string> TicketCodes { get; set; } = new();
}