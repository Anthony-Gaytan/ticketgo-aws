using TicketGo.Api.DTOs.Users;

namespace TicketGo.Api.Interfaces.Services;

public interface IUserService
{
    Task<List<UserResponseDto>> GetAllAsync();

    Task<UserResponseDto?> GetByIdAsync(Guid id);

    Task<UserResponseDto> CreateAsync(CreateUserDto request);

    Task<UserMeResponseDto> GetMeAsync(Guid userId);

    Task<UserMeResponseDto> UpdateMeAsync(Guid userId, UpdateMyProfileDto request);

    Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordDto request);
}