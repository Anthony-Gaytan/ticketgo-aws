using QRCoder;
using TicketGo.Api.Interfaces.Services;

namespace TicketGo.Api.Services;

public class QrService : IQrService
{
    public string GenerateQrBase64(string content)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);

        var qrCode = new PngByteQRCode(qrData);
        var qrBytes = qrCode.GetGraphic(20);

        return $"data:image/png;base64,{Convert.ToBase64String(qrBytes)}";
    }
}