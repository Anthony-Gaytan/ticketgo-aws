namespace TicketGo.Api.Interfaces.Services;

public interface IQrService
{
    string GenerateQrBase64(string content);
}