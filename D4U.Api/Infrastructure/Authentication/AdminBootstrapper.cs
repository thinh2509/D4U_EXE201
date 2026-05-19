namespace D4U.Api.Infrastructure.Authentication;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

public static class AdminBootstrapper
{
    public static async Task SeedD4UAdminAsync(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var options = scope.ServiceProvider.GetRequiredService<IOptions<AdminBootstrapOptions>>().Value;

        if (string.IsNullOrWhiteSpace(options.Email) || string.IsNullOrWhiteSpace(options.Password))
        {
            return;
        }

        var email = options.Email.Trim().ToLowerInvariant();
        var username = string.IsNullOrWhiteSpace(options.Username) ? "admin" : options.Username.Trim();
        var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
        var existingAdmin = await dbContext.Users.FirstOrDefaultAsync(user => user.Email == email);

        if (existingAdmin is not null)
        {
            return;
        }

        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
        var now = DateTimeOffset.UtcNow;
        var admin = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Username = username,
            FullName = string.IsNullOrWhiteSpace(options.FullName) ? "D4U Admin" : options.FullName.Trim(),
            Role = UserRole.ADMIN,
            Status = UserStatus.ACTIVE,
            EmailVerifiedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        admin.PasswordHash = hasher.HashPassword(admin, options.Password);

        await dbContext.Users.AddAsync(admin);
        await dbContext.SaveChangesAsync();
    }
}
