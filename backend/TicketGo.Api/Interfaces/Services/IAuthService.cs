using TicketGo.Api.DTOs.Auth;

namespace TicketGo.Api.Interfaces.Services;

public interface IAuthService
{
    Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request);

    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
}