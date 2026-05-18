using Microsoft.EntityFrameworkCore;

namespace D4U.Api.Infrastructure.Persistence;

public sealed class D4UDbContext(DbContextOptions<D4UDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("public");
    }
}
