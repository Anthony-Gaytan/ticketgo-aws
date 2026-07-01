using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.Users;
using TicketGo.Api.Entities;

namespace TicketGo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly TicketGoDbContext _context;

    public UsersController(TicketGoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _context.Users
            .Select(u => new UserResponseDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var user = await _context.Users
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

        if (user == null)
            return NotFound("Usuario no encontrado.");

        return Ok(user);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateUserDto request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest("Ya existe un usuario con ese correo.");

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var response = new UserResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, response);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userIdClaim))
            return Unauthorized("Usuario no autenticado o token inválido.");

        var userId = Guid.Parse(userIdClaim);
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return NotFound("Usuario no encontrado.");

        var response = new UserMeResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };

        return Ok(response);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMyProfileDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userIdClaim))
            return Unauthorized("Usuario no autenticado o token inválido.");

        var userId = Guid.Parse(userIdClaim);
        
        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email))
            return BadRequest("Nombre completo y correo electrónico son obligatorios.");

        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (existingUser == null)
            return NotFound("Usuario no encontrado.");

        // Check if the new email is already used by another user (excluding current user)
        if (existingUser.Email != request.Email && await _context.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest("El correo electrónico ya está en uso por otro usuario.");

        existingUser.FullName = request.FullName;
        existingUser.Email = request.Email;

        await _context.SaveChangesAsync();

        var response = new UserMeResponseDto
        {
            Id = existingUser.Id,
            FullName = existingUser.FullName,
            Email = existingUser.Email,
            Role = existingUser.Role
        };

        return Ok(response);
    }

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userIdClaim))
            return Unauthorized("Usuario no autenticado o token inválido.");

        var userId = Guid.Parse(userIdClaim);

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest("Todos los campos de contraseña son obligatorios.");

        if (request.NewPassword != request.ConfirmPassword)
            return BadRequest("Las contraseñas nuevas no coinciden.");

        // Validate strong password requirements
        if (request.NewPassword.Length < 8 ||
            !request.NewPassword.Any(char.IsUpper) ||
            !request.NewPassword.Any(char.IsLower) ||
            !request.NewPassword.Any(char.IsDigit) ||
            !request.NewPassword.Any(ch => !char.IsLetterOrDigit(ch)))
        {
            return BadRequest("La nueva contraseña debe tener un mínimo de 8 caracteres, al menos una letra mayúscula, una letra minúscula, un número y un carácter especial (símbolo).");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return NotFound("Usuario no encontrado.");

        // Verify current password
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest("La contraseña actual es incorrecta.");

        // Hash and update new password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Contraseña actualizada correctamente." });
    }
}