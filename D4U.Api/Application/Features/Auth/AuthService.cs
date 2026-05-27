namespace D4U.Api.Application.Features.Auth;

using System.Security.Cryptography;
using System.Text;
using D4U.Api.Application.Common.Data;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Authentication;
using D4U.Api.Infrastructure.Email;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

public sealed class AuthService(
    IUnitOfWork unitOfWork,
    IPasswordHasher<User> passwordHasher,
    ITokenService tokenService,
    IGoogleTokenValidator googleTokenValidator,
    IRefreshTokenService refreshTokenService,
    IEmailSender emailSender,
    IOptions<UserEmailVerificationOptions> emailVerificationOptions,
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
        var verification = CreateEmailVerification(user, now, out var code);
        await unitOfWork.Repository<UserEmailVerification>().AddAsync(verification, cancellationToken);
        await SendEmailVerificationCodeAsync(user, code, verification.ExpiresAt, cancellationToken);
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

        EnsureEmailVerified(user);

        user.LastLoginAt = DateTimeOffset.UtcNow;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        return await CreateAuthResponseAsync(user, deviceInfo, ipAddress, cancellationToken);
    }

    public async Task<AuthResponse> LoginWithGoogleAsync(
        GoogleLoginRequest request,
        string? deviceInfo,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        if (request.Role is not (UserRole.STUDENT or UserRole.SME))
        {
            throw new InvalidOperationException("Google login only supports STUDENT and SME accounts.");
        }

        var googleUser = await googleTokenValidator.ValidateAsync(request.IdToken, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var externalLogins = unitOfWork.Repository<UserExternalLogin>();

        var externalLogin = await externalLogins.FirstOrDefaultAsync(
            login => login.Provider == "GOOGLE" && login.ProviderUserId == googleUser.Subject,
            cancellationToken);

        User? user = null;

        if (externalLogin is not null)
        {
            user = await unitOfWork.Repository<User>().GetByIdAsync(externalLogin.UserId, cancellationToken);
        }

        user ??= await FindUserByEmailAsync(googleUser.Email, cancellationToken);

        if (user is null)
        {
            user = await CreateGoogleUserAsync(googleUser, request.Role, now, cancellationToken);
        }
        else
        {
            if (user.Role is not (UserRole.STUDENT or UserRole.SME))
            {
                throw new UnauthorizedAccessException("Google login is not available for this account.");
            }

            if (user.Role != request.Role)
            {
                throw new InvalidOperationException("Google login role does not match the existing D4U account role.");
            }

            user.EmailVerifiedAt ??= now;
            user.AvatarUrl ??= googleUser.AvatarUrl;
            user.LastLoginAt = now;
            user.UpdatedAt = now;
        }

        EnsureCanAuthenticate(user);

        if (externalLogin is null)
        {
            await externalLogins.AddAsync(new UserExternalLogin
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Provider = "GOOGLE",
                ProviderUserId = googleUser.Subject,
                Email = googleUser.Email,
                CreatedAt = now,
                UpdatedAt = now
            }, cancellationToken);
        }
        else
        {
            externalLogin.Email = googleUser.Email;
            externalLogin.UpdatedAt = now;
        }

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
        EnsureEmailVerified(user);

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

    public async Task<UserEmailVerificationResponse> RequestEmailVerificationAsync(
        RequestUserEmailVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await FindUserByEmailAsync(request.Email, cancellationToken);

        if (user is null)
        {
            throw new InvalidOperationException("Email is not registered.");
        }

        if (user.EmailVerifiedAt is not null)
        {
            return new UserEmailVerificationResponse(user.Email, "CONFIRMED", DateTimeOffset.UtcNow, user.EmailVerifiedAt);
        }

        var now = DateTimeOffset.UtcNow;
        await ReplacePendingEmailVerificationsAsync(user.Id, now, cancellationToken);

        var verification = CreateEmailVerification(user, now, out var code);
        await unitOfWork.Repository<UserEmailVerification>().AddAsync(verification, cancellationToken);
        await SendEmailVerificationCodeAsync(user, code, verification.ExpiresAt, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToEmailVerificationResponse(verification);
    }

    public async Task<UserEmailVerificationResponse> ConfirmEmailVerificationAsync(
        ConfirmUserEmailVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await FindUserByEmailAsync(request.Email, cancellationToken);

        if (user is null)
        {
            throw new InvalidOperationException("Email is not registered.");
        }

        if (user.EmailVerifiedAt is not null)
        {
            return new UserEmailVerificationResponse(user.Email, "CONFIRMED", DateTimeOffset.UtcNow, user.EmailVerifiedAt);
        }

        var now = DateTimeOffset.UtcNow;
        var normalizedEmail = NormalizeEmail(request.Email);
        var verifications = unitOfWork.Repository<UserEmailVerification>();
        var verification = await verifications.FirstOrDefaultAsync(
            value => value.UserId == user.Id &&
                     value.Email == normalizedEmail &&
                     value.Status == "PENDING",
            cancellationToken);

        if (verification is null)
        {
            throw new InvalidOperationException("Email verification code is not found or has already been used.");
        }

        if (verification.ExpiresAt < now)
        {
            verification.Status = "EXPIRED";
            await unitOfWork.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Email verification code has expired.");
        }

        if (!string.Equals(verification.CodeHash, HashCode(request.Code), StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Email verification code is invalid.");
        }

        verification.Status = "CONFIRMED";
        verification.ConfirmedAt = now;
        user.EmailVerifiedAt = now;
        user.UpdatedAt = now;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToEmailVerificationResponse(verification);
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

    private async Task<User> CreateGoogleUserAsync(
        GoogleUserInfo googleUser,
        UserRole role,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = googleUser.Email,
            Username = await GenerateUniqueUsernameAsync(googleUser.Email, cancellationToken),
            FullName = googleUser.FullName,
            AvatarUrl = googleUser.AvatarUrl,
            Role = role,
            Status = UserStatus.PENDING,
            EmailVerifiedAt = now,
            LastLoginAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        user.PasswordHash = passwordHasher.HashPassword(user, Guid.NewGuid().ToString("N"));

        await unitOfWork.Repository<User>().AddAsync(user, cancellationToken);

        return user;
    }

    private async Task<string> GenerateUniqueUsernameAsync(
        string email,
        CancellationToken cancellationToken)
    {
        var localPart = email.Split('@')[0];
        var sanitized = new string(localPart
            .Select(character => char.IsLetterOrDigit(character) ? character : '_')
            .ToArray())
            .Trim('_')
            .ToLowerInvariant();

        if (sanitized.Length < 3)
        {
            sanitized = $"user{Random.Shared.Next(1000, 9999)}";
        }

        if (sanitized.Length > 90)
        {
            sanitized = sanitized[..90];
        }

        var users = unitOfWork.Repository<User>();
        var candidate = sanitized;
        var counter = 1;

        while (await users.AnyAsync(user => user.Username == candidate, cancellationToken))
        {
            candidate = $"{sanitized}{counter}";
            counter++;
        }

        return candidate;
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private UserEmailVerification CreateEmailVerification(
        User user,
        DateTimeOffset now,
        out string code)
    {
        var options = emailVerificationOptions.Value;
        code = GenerateNumericCode(options.CodeLength);

        return new UserEmailVerification
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Email = user.Email,
            CodeHash = HashCode(code),
            Status = "PENDING",
            RequestedAt = now,
            ExpiresAt = now.AddMinutes(options.CodeExpiresMinutes)
        };
    }

    private async Task ReplacePendingEmailVerificationsAsync(
        Guid userId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var pending = await unitOfWork.Repository<UserEmailVerification>().Query()
            .Where(verification => verification.UserId == userId && verification.Status == "PENDING")
            .ToListAsync(cancellationToken);

        foreach (var verification in pending)
        {
            verification.Status = verification.ExpiresAt < now ? "EXPIRED" : "REPLACED";
        }
    }

    private async Task SendEmailVerificationCodeAsync(
        User user,
        string code,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken)
    {
        var html = $"""
            <p>Xin chào {System.Net.WebUtility.HtmlEncode(user.FullName)},</p>
            <p>Mã xác minh email D4U của bạn là:</p>
            <h2 style="letter-spacing: 4px;">{code}</h2>
            <p>Mã này hết hạn lúc {expiresAt:yyyy-MM-dd HH:mm:ss} UTC.</p>
            <p>Nếu bạn không tạo tài khoản D4U, vui lòng bỏ qua email này.</p>
            """;

        await emailSender.SendAsync(user.Email, "Mã xác minh email D4U", html, cancellationToken);
    }

    private static string GenerateNumericCode(int length)
    {
        var safeLength = Math.Clamp(length, 4, 12);
        var builder = new StringBuilder(safeLength);

        for (var index = 0; index < safeLength; index++)
        {
            builder.Append(RandomNumberGenerator.GetInt32(0, 10));
        }

        return builder.ToString();
    }

    private static string HashCode(string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code.Trim()));
        return Convert.ToHexString(bytes);
    }

    private static void EnsureCanAuthenticate(User user)
    {
        if (user.Status is UserStatus.SUSPENDED or UserStatus.BANNED or UserStatus.DELETED)
        {
            throw new UnauthorizedAccessException("Account is not allowed to authenticate.");
        }
    }

    private static void EnsureEmailVerified(User user)
    {
        if (user.EmailVerifiedAt is null)
        {
            throw new UnauthorizedAccessException("Email is not verified.");
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

    private static UserEmailVerificationResponse ToEmailVerificationResponse(UserEmailVerification verification)
    {
        return new UserEmailVerificationResponse(
            verification.Email,
            verification.Status,
            verification.ExpiresAt,
            verification.ConfirmedAt);
    }
}
