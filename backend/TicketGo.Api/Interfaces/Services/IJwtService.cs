using TicketGo.Api.Entities;

namespace TicketGo.Api.Interfaces.Services;

public interface IJwtService
{
    string GenerateToken(User user, out DateTime expiration);
}