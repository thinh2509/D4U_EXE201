namespace D4U.Api.Application.Features.Auth;

using D4U.Api.Application.Common.Data;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

public sealed class AuthService(
    IUnitOfWork unitOfWork,
    IPasswordHasher<User> passwordHasher,
    ITokenService tokenService,
    IRefreshTokenService refreshTokenService,
    IOptions<JwtOptions> jwtOptions) : IAuthService
{
    public async Task<AuthUserResponse> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);
        var username = request.Username.Trim();
        var fullName = request.FullName.Trim();

        if (request.Role is not (UserRole.STUDENT or UserRole.SME))
        {
            throw new InvalidOperationException("Only STUDENT and SME accounts can self-register.");
        }

        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(fullName) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            throw new InvalidOperationException("Email, username, password, and full name are required.");
        }

        var users = unitOfWork.Repository<User>();

        if (await users.AnyAsync(user => user.Email == email, cancellationToken))
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        if (await users.AnyAsync(user => user.Username == username, cancellationToken))
        {
            throw new InvalidOperationException("Username is already registered.");
        }

        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Username = username,
            FullName = fullName,
            Role = request.Role,
            Status = UserStatus.PENDING,
            CreatedAt = now,
            UpdatedAt = now
        };

        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        await users.AddAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToUserResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(
        LoginRequest request,
        string? deviceInfo,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        var user = await FindUserByEmailAsync(request.Email, cancellationToken);

        if (user is null)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        EnsureCanAuthenticate(user);

        var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (verification == PasswordVerificationResult.Failed)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        user.LastLoginAt = DateTimeOffset.UtcNow;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        return await CreateAuthResponseAsync(user, deviceInfo, ipAddress, cancellationToken);
    }

    public async Task<AuthResponse> RefreshAsync(
        RefreshTokenRequest request,
        string? deviceInfo,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        var refreshTokenHash = refreshTokenService.Hash(request.RefreshToken);
        var sessions = unitOfWork.Repository<UserSession>();
        var session = await sessions.FirstOrDefaultAsync(
            userSession => userSession.RefreshTokenHash == refreshTokenHash &&
                           userSession.RevokedAt == null &&
                           userSession.ExpiresAt > DateTimeOffset.UtcNow,
            cancellationToken);

        if (session is null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        var user = await unitOfWork.Repository<User>().GetByIdAsync(session.UserId, cancellationToken);

        if (user is null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        EnsureCanAuthenticate(user);

        session.RevokedAt = DateTimeOffset.UtcNow;

        return await CreateAuthResponseAsync(user, deviceInfo, ipAddress, cancellationToken);
    }

    public async Task LogoutAsync(
        LogoutRequest request,
        CancellationToken cancellationToken = default)
    {
        var refreshTokenHash = refreshTokenService.Hash(request.RefreshToken);
        var session = await unitOfWork.Repository<UserSession>().FirstOrDefaultAsync(
            userSession => userSession.RefreshTokenHash == refreshTokenHash &&
                           userSession.RevokedAt == null,
            cancellationToken);

        if (session is not null)
        {
            session.RevokedAt = DateTimeOffset.UtcNow;
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<AuthUserResponse> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken);

        if (user is null)
        {
            throw new UnauthorizedAccessException("User not found.");
        }

        return ToUserResponse(user);
    }

    private async Task<AuthResponse> CreateAuthResponseAsync(
        User user,
        string? deviceInfo,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        var accessToken = tokenService.CreateAccessToken(user);
        var accessTokenExpiresAt = DateTimeOffset.UtcNow.AddMinutes(jwtOptions.Value.AccessTokenMinutes);
        var refreshToken = refreshTokenService.CreateRefreshToken();
        var refreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(jwtOptions.Value.RefreshTokenDays);

        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshTokenHash = refreshTokenService.Hash(refreshToken),
            DeviceInfo = deviceInfo,
            IpAddress = ipAddress,
            ExpiresAt = refreshTokenExpiresAt,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await unitOfWork.Repository<UserSession>().AddAsync(session, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            accessToken,
            accessTokenExpiresAt,
            refreshToken,
            refreshTokenExpiresAt,
            ToUserResponse(user));
    }

    private async Task<User?> FindUserByEmailAsync(
        string email,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = NormalizeEmail(email);
        return await unitOfWork.Repository<User>().FirstOrDefaultAsync(
            user => user.Email == normalizedEmail,
            cancellationToken);
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static void EnsureCanAuthenticate(User user)
    {
        if (user.Status is UserStatus.SUSPENDED or UserStatus.BANNED or UserStatus.DELETED)
        {
            throw new UnauthorizedAccessException("Account is not allowed to authenticate.");
        }
    }

    private static AuthUserResponse ToUserResponse(User user)
    {
        return new AuthUserResponse(
            user.Id,
            user.Email,
            user.Username,
            user.FullName,
            user.Role,
            user.Status,
            user.CreatedAt);
    }
}
