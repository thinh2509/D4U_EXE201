namespace D4U.Api.Application.Features.Auth;

public interface IGoogleTokenValidator
{
    Task<GoogleUserInfo> ValidateAsync(
        string idToken,
        CancellationToken cancellationToken = default);
}

public sealed record GoogleUserInfo(
    string Subject,
    string Email,
    bool EmailVerified,
    string FullName,
    string? AvatarUrl);
