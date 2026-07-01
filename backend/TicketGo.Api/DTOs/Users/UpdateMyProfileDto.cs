using System;

namespace TicketGo.Api.DTOs.Users;

public class UpdateMyProfileDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
