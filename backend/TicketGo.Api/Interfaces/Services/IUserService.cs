using TicketGo.Api.DTOs.Users;

namespace TicketGo.Api.Interfaces;

public interface IUserService
{
    Task<List<UserResponseDto>> GetAllAsync();

    Task<UserResponseDto?> GetByIdAsync(Guid id);

    Task<UserResponseDto> CreateAsync(CreateUserDto request);
}