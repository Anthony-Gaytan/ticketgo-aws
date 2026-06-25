using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.Auth;
using TicketGo.Api.Entities;
using TicketGo.Api.Interfaces.Services;

namespace TicketGo.Api.Services;

public class AuthService : IAuthService
{
    private readonly TicketGoDbContext _context;
    private readonly IJwtService _jwtService;

    public AuthService(
        TicketGoDbContext context,
        IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var exists = await _context.Users
            .AnyAsync(x => x.Email == request.Email);

        if (exists)
            throw new InvalidOperationException("El correo ya está registrado.");

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Customer",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new RegisterResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(x => x.Email == request.Email);

        if (user == null)
            throw new UnauthorizedAccessException("Correo o contraseña incorrectos.");

        if (!user.IsActive)
            throw new Exception("El usuario se encuentra inactivo.");

        var passwordValid = BCrypt.Net.BCrypt.Verify(
            request.Password,
            user.PasswordHash);

        if (!passwordValid)
            throw new UnauthorizedAccessException("Correo o contraseña incorrectos.");

        var token = _jwtService.GenerateToken(user, out var expiration);

        return new LoginResponseDto
        {
            Token = token,
            Expiration = expiration,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };
    }
}