using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Data;
using TicketGo.Api.DTOs.Users;
using TicketGo.Api.Entities;
using TicketGo.Api.Interfaces;

namespace TicketGo.Api.Services;

public class UserService : IUserService
{
    private readonly TicketGoDbContext _context;
    private readonly IMapper _mapper;

    public UserService(
        TicketGoDbContext context,
        IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public Task<List<UserResponseDto>> GetAllAsync()
    {
        throw new NotImplementedException();
    }

    public Task<UserResponseDto?> GetByIdAsync(Guid id)
    {
        throw new NotImplementedException();
    }

    public Task<UserResponseDto> CreateAsync(CreateUserDto request)
    {
        throw new NotImplementedException();
    }
}