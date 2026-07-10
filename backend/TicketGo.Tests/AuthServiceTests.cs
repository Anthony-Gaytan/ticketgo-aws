using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.Auth;
using TicketGo.Api.Entities;
using TicketGo.Api.Interfaces.Services;
using TicketGo.Api.Services;
using Xunit;

namespace TicketGo.Tests;

public class AuthServiceTests
{
    private TicketGoDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<TicketGoDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new TicketGoDbContext(options);
    }

    [Fact]
    public async Task RegisterAsync_WhenSuccessful_ShouldPersistUserAndReturnResponse()
    {
        // Arrange
        var context = GetDbContext();
        var jwtMock = new Mock<IJwtService>();
        var service = new AuthService(context, jwtMock.Object);

        var request = new RegisterRequestDto
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Password = "Password123!"
        };

        // Act
        var result = await service.RegisterAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.FullName.Should().Be("John Doe");
        result.Email.Should().Be("john.doe@example.com");
        result.Role.Should().Be("Customer");

        var dbUser = await context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        dbUser.Should().NotBeNull();
        dbUser!.FullName.Should().Be("John Doe");
        BCrypt.Net.BCrypt.Verify("Password123!", dbUser.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task RegisterAsync_WhenEmailAlreadyExists_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var context = GetDbContext();
        var jwtMock = new Mock<IJwtService>();
        var service = new AuthService(context, jwtMock.Object);

        var existingUser = new User
        {
            FullName = "Existing User",
            Email = "duplicate@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OldPass1!"),
            Role = "Customer",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(existingUser);
        await context.SaveChangesAsync();

        var request = new RegisterRequestDto
        {
            FullName = "New User",
            Email = "duplicate@example.com",
            Password = "NewPassword123!"
        };

        // Act
        Func<Task> act = async () => await service.RegisterAsync(request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("El correo ya está registrado.");
    }

    [Fact]
    public async Task LoginAsync_WhenCredentialsAreValid_ShouldReturnToken()
    {
        // Arrange
        var context = GetDbContext();
        var jwtMock = new Mock<IJwtService>();
        var expiration = DateTime.UtcNow.AddHours(1);
        
        // Mocking the 'out' parameter in Moq:
        jwtMock.Setup(x => x.GenerateToken(It.IsAny<User>(), out expiration))
            .Returns("jwt-mocked-token-xyz");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword("ValidPassword123!");
        var user = new User
        {
            FullName = "Logged User",
            Email = "login@example.com",
            PasswordHash = passwordHash,
            Role = "Customer",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new AuthService(context, jwtMock.Object);
        var request = new LoginRequestDto
        {
            Email = "login@example.com",
            Password = "ValidPassword123!"
        };

        // Act
        var result = await service.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().Be("jwt-mocked-token-xyz");
        result.Email.Should().Be("login@example.com");
    }

    [Fact]
    public async Task LoginAsync_WhenPasswordIsIncorrect_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var context = GetDbContext();
        var jwtMock = new Mock<IJwtService>();

        var passwordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword!");
        var user = new User
        {
            FullName = "Logged User",
            Email = "login-fail@example.com",
            PasswordHash = passwordHash,
            Role = "Customer",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new AuthService(context, jwtMock.Object);
        var request = new LoginRequestDto
        {
            Email = "login-fail@example.com",
            Password = "WrongPassword!"
        };

        // Act
        Func<Task> act = async () => await service.LoginAsync(request);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Correo o contraseña incorrectos.");
    }
}
