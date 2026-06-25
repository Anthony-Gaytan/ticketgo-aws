namespace TicketGo.Api.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    // Se almacenará el hash, nunca la contraseña en texto plano
    public string PasswordHash { get; set; } = string.Empty;

    // Admin | Organizer | Customer
    public string Role { get; set; } = "Customer";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Relación 1:N -> Un usuario puede tener muchas órdenes
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}