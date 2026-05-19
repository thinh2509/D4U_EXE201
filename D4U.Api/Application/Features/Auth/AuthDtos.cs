namespace D4U.Api.Application.Features.Auth;

using D4U.Api.Domain.Enums;

public sealed record RegisterRequest(
    string Email,
    string Username,
    string Password,
    string FullName,
    UserRole Role);

public sealed record LoginRequest(
    string Email,
    string Password);

public sealed record RefreshTokenRequest(
    string RefreshToken);

public sealed record LogoutRequest(
    string RefreshToken);

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt,
    AuthUserResponse User);

public sealed record AuthUserResponse(
    Guid Id,
    string Email,
    string Username,
    string FullName,
    UserRole Role,
    UserStatus Status,
    DateTimeOffset CreatedAt);
