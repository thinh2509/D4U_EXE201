namespace D4U.Api.Application.Features.Auth;

public interface IAuthService
{
    Task<AuthUserResponse> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default);

    Task<AuthResponse> LoginAsync(
        LoginRequest request,
        string? deviceInfo,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<AuthResponse> LoginWithGoogleAsync(
        GoogleLoginRequest request,
        string? deviceInfo,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task<AuthResponse> RefreshAsync(
        RefreshTokenRequest request,
        string? deviceInfo,
        string? ipAddress,
        CancellationToken cancellationToken = default);

    Task LogoutAsync(
        LogoutRequest request,
        CancellationToken cancellationToken = default);

    Task<UserEmailVerificationResponse> RequestEmailVerificationAsync(
        RequestUserEmailVerificationRequest request,
        CancellationToken cancellationToken = default);

    Task<UserEmailVerificationResponse> ConfirmEmailVerificationAsync(
        ConfirmUserEmailVerificationRequest request,
        CancellationToken cancellationToken = default);

    Task<AuthUserResponse> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
