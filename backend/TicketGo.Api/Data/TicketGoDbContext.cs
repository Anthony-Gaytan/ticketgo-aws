using Microsoft.EntityFrameworkCore;
using TicketGo.Api.Entities;

namespace TicketGo.Api.Data;

public class TicketGoDbContext : DbContext
{
    public TicketGoDbContext(DbContextOptions<TicketGoDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<EventTicketType> EventTicketTypes => Set<EventTicketType>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User 1 -> N Orders
        modelBuilder.Entity<Order>()
            .HasOne(o => o.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // User 1 -> N Events (Organizer)
        modelBuilder.Entity<Event>()
            .HasOne(e => e.Organizer)
            .WithMany()
            .HasForeignKey(e => e.OrganizerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Event 1 -> N EventTicketTypes
        modelBuilder.Entity<EventTicketType>()
            .HasOne(tt => tt.Event)
            .WithMany(e => e.TicketTypes)
            .HasForeignKey(tt => tt.EventId)
            .OnDelete(DeleteBehavior.Restrict);

        // Event 1 -> N Tickets
        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Event)
            .WithMany(e => e.Tickets)
            .HasForeignKey(t => t.EventId)
            .OnDelete(DeleteBehavior.Restrict);

        // Order 1 -> N Tickets
        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Order)
            .WithMany(o => o.Tickets)
            .HasForeignKey(t => t.OrderId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}