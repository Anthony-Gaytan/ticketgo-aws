using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.Users;
using TicketGo.Api.Entities;
using TicketGo.Api.Interfaces.Services;

namespace TicketGo.Api.Services;

public class UserService : IUserService
{
    private readonly TicketGoDbContext _context;

    public UserService(TicketGoDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserResponseDto>> GetAllAsync()
    {
        return await _context.Users
            .Select(u => new UserResponseDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<UserResponseDto?> GetByIdAsync(Guid id)
    {
        return await _context.Users
            .Where(u => u.Id == id)
            .Select(u => new UserResponseDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<UserResponseDto> CreateAsync(CreateUserDto request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("Ya existe un usuario con ese correo.");

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            Role = "Customer",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new UserResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserMeResponseDto> GetMeAsync(Guid userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            throw new KeyNotFoundException("Usuario no encontrado.");

        return new UserMeResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };
    }

    public async Task<UserMeResponseDto> UpdateMeAsync(Guid userId, UpdateMyProfileDto request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Nombre completo y correo electrónico son obligatorios.");

        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (existingUser == null)
            throw new KeyNotFoundException("Usuario no encontrado.");

        if (existingUser.Email != request.Email && await _context.Users.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("El correo electrónico ya está en uso por otro usuario.");

        existingUser.FullName = request.FullName;
        existingUser.Email = request.Email;

        await _context.SaveChangesAsync();

        return new UserMeResponseDto
        {
            Id = existingUser.Id,
            FullName = existingUser.FullName,
            Email = existingUser.Email,
            Role = existingUser.Role
        };
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordDto request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            throw new ArgumentException("Todos los campos de contraseña son obligatorios.");

        if (request.NewPassword != request.ConfirmPassword)
            throw new ArgumentException("Las contraseñas nuevas no coinciden.");

        if (request.NewPassword.Length < 8 ||
            !request.NewPassword.Any(char.IsUpper) ||
            !request.NewPassword.Any(char.IsLower) ||
            !request.NewPassword.Any(char.IsDigit) ||
            !request.NewPassword.Any(ch => !char.IsLetterOrDigit(ch)))
        {
            throw new ArgumentException("La nueva contraseña debe tener un mínimo de 8 caracteres, al menos una letra mayúscula, una letra minúscula, un número y un carácter especial (símbolo).");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            throw new KeyNotFoundException("Usuario no encontrado.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new InvalidOperationException("La contraseña actual es incorrecta.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return true;
    }
}