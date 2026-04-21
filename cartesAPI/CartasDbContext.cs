namespace cartesAPI;

using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;

public class CartasDbContext : DbContext
{
    public DbSet<Carta> Cartas { get; init; }
    public DbSet<Personatge> Personatges { get; init; }
    

    public CartasDbContext(DbContextOptions<CartasDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    
        modelBuilder.Entity<Carta>().ToCollection("cartas");
        modelBuilder.Entity<Personatge>().ToCollection("personatges");
        
        modelBuilder.Entity<Carta>()
            .Property(c => c.InternalId)
            .HasElementName("_id");

        modelBuilder.Entity<Carta>()
            .Property(c => c.CartaId)
            .HasElementName("id");
    }
}