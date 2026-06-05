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

    public static async Task SeedD4UDemoAccountsAsync(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var options = scope.ServiceProvider.GetRequiredService<IOptions<DemoSeedOptions>>().Value;

        if (!options.Enabled || string.IsNullOrWhiteSpace(options.Password))
        {
            return;
        }

        var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
        var basicPlan = await dbContext.SubscriptionPlans.FirstOrDefaultAsync(
            plan => plan.Code == "BASIC" && plan.IsActive);

        if (basicPlan is null)
        {
            return;
        }

        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
        var now = DateTimeOffset.UtcNow;

        await SeedDemoSmeAsync(dbContext, hasher, basicPlan.Id, options, now);
        await SeedDemoStudentAsync(dbContext, hasher, options, now);
        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedDemoSmeAsync(
        D4UDbContext dbContext,
        IPasswordHasher<User> hasher,
        Guid basicPlanId,
        DemoSeedOptions options,
        DateTimeOffset now)
    {
        var email = options.SmeEmail.Trim().ToLowerInvariant();
        if (await dbContext.Users.AnyAsync(user => user.Email == email))
        {
            return;
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Username = "sme.demo",
            FullName = "SME Demo",
            Role = UserRole.SME,
            Status = UserStatus.ACTIVE,
            EmailVerifiedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };
        user.PasswordHash = hasher.HashPassword(user, options.Password);

        await dbContext.Users.AddAsync(user);
        await dbContext.SmeProfiles.AddAsync(
            new SmeProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                CompanyName = "D4U Demo Studio",
                RepresentativeName = "SME Demo",
                PhoneNumber = "0900000001",
                BusinessField = "Retail branding",
                OnboardingStatus = "COMPLETED",
                SubscriptionPlanId = basicPlanId,
                SubscriptionStartedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            });
    }

    private static async Task SeedDemoStudentAsync(
        D4UDbContext dbContext,
        IPasswordHasher<User> hasher,
        DemoSeedOptions options,
        DateTimeOffset now)
    {
        var email = options.StudentEmail.Trim().ToLowerInvariant();
        if (await dbContext.Users.AnyAsync(user => user.Email == email))
        {
            return;
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Username = "student.demo",
            FullName = "Student Demo",
            Role = UserRole.STUDENT,
            Status = UserStatus.ACTIVE,
            EmailVerifiedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };
        user.PasswordHash = hasher.HashPassword(user, options.Password);

        await dbContext.Users.AddAsync(user);
        await dbContext.StudentProfiles.AddAsync(
            new StudentProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                School = "D4U Demo University",
                Major = "Graphic Design",
                StudyStartYear = now.Year - 2,
                Bio = "Verified demo student for Outcome 1 flows.",
                OnboardingStatus = "COMPLETED",
                VerificationStatus = "APPROVED",
                CanWithdraw = true,
                CreatedAt = now,
                UpdatedAt = now
            });
    }
}
