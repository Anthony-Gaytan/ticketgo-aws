namespace TicketGo.Api.DTOs.Orders;

public class PurchaseRequestDto
{
    public Guid EventTicketTypeId { get; set; }

    public int Quantity { get; set; }
}