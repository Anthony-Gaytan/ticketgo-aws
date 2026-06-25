using AutoMapper;
using TicketGo.Api.DTOs.Users;
using TicketGo.Api.Entities;

namespace TicketGo.Api.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserResponseDto>();

        CreateMap<CreateUserDto, User>();

        CreateMap<UpdateUserDto, User>();
    }
}