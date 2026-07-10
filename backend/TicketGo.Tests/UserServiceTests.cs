using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.Users;
using TicketGo.Api.Entities;
using TicketGo.Api.Services;
using Xunit;

namespace TicketGo.Tests;

public class UserServiceTests
{
    private TicketGoDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<TicketGoDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new TicketGoDbContext(options);
    }

    [Fact]
    public async Task GetMeAsync_WhenUserExists_ShouldReturnUserData()
    {
        // Arrange
        var context = GetDbContext();
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            FullName = "Alice Smith",
            Email = "alice@example.com",
            PasswordHash = "hashed",
            Role = "Organizer",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new UserService(context);

        // Act
        var result = await service.GetMeAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(userId);
        result.FullName.Should().Be("Alice Smith");
        result.Email.Should().Be("alice@example.com");
        result.Role.Should().Be("Organizer");
    }

    [Fact]
    public async Task UpdateMeAsync_WhenDataIsValid_ShouldUpdateUserInDatabase()
    {
        // Arrange
        var context = GetDbContext();
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            FullName = "Bob Jones",
            Email = "bob.old@example.com",
            PasswordHash = "hashed",
            Role = "Customer",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new UserService(context);
        var request = new UpdateMyProfileDto
        {
            FullName = "Bob NewName",
            Email = "bob.new@example.com"
        };

        // Act
        var result = await service.UpdateMeAsync(userId, request);

        // Assert
        result.Should().NotBeNull();
        result.FullName.Should().Be("Bob NewName");
        result.Email.Should().Be("bob.new@example.com");

        var dbUser = await context.Users.FirstAsync(u => u.Id == userId);
        dbUser.FullName.Should().Be("Bob NewName");
        dbUser.Email.Should().Be("bob.new@example.com");
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenCurrentPasswordIsCorrect_ShouldHashAndSaveNewPassword()
    {
        // Arrange
        var context = GetDbContext();
        var userId = Guid.NewGuid();
        var oldPasswordHash = BCrypt.Net.BCrypt.HashPassword("OldSecr3t!");
        var user = new User
        {
            Id = userId,
            FullName = "Charlie Brown",
            Email = "charlie@example.com",
            PasswordHash = oldPasswordHash,
            Role = "Customer",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new UserService(context);
        var request = new ChangePasswordDto
        {
            CurrentPassword = "OldSecr3t!",
            NewPassword = "NewSecr3t1!",
            ConfirmPassword = "NewSecr3t1!"
        };

        // Act
        var result = await service.ChangePasswordAsync(userId, request);

        // Assert
        result.Should().BeTrue();
        var dbUser = await context.Users.FirstAsync(u => u.Id == userId);
        BCrypt.Net.BCrypt.Verify("NewSecr3t1!", dbUser.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenCurrentPasswordIsIncorrect_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var context = GetDbContext();
        var userId = Guid.NewGuid();
        var oldPasswordHash = BCrypt.Net.BCrypt.HashPassword("OldSecr3t!");
        var user = new User
        {
            Id = userId,
            FullName = "Charlie Brown",
            Email = "charlie@example.com",
            PasswordHash = oldPasswordHash,
            Role = "Customer",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new UserService(context);
        var request = new ChangePasswordDto
        {
            CurrentPassword = "WrongPassword!",
            NewPassword = "NewSecr3t1!",
            ConfirmPassword = "NewSecr3t1!"
        };

        // Act
        Func<Task> act = async () => await service.ChangePasswordAsync(userId, request);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("La contraseña actual es incorrecta.");
    }
}
