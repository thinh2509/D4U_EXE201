namespace D4U.Api.Infrastructure.Authentication;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using D4U.Api.Application.Features.Auth;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

public sealed class GoogleTokenValidator(
    IOptions<GoogleAuthOptions> googleAuthOptions,
    IConfigurationManager<OpenIdConnectConfiguration> configurationManager) : IGoogleTokenValidator
{
    private static readonly string[] ValidIssuers = ["https://accounts.google.com", "accounts.google.com"];

    public async Task<GoogleUserInfo> ValidateAsync(
        string idToken,
        CancellationToken cancellationToken = default)
    {
        var options = googleAuthOptions.Value;

        if (string.IsNullOrWhiteSpace(options.ClientId))
        {
            throw new InvalidOperationException("GoogleAuth:ClientId is not configured.");
        }

        var configuration = await configurationManager.GetConfigurationAsync(cancellationToken);
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuers = ValidIssuers,
            ValidateAudience = true,
            ValidAudience = options.ClientId,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKeys = configuration.SigningKeys,
            ClockSkew = TimeSpan.FromMinutes(2)
        };

        var handler = new JwtSecurityTokenHandler
        {
            MapInboundClaims = false
        };
        System.Security.Claims.ClaimsPrincipal principal;

        try
        {
            principal = handler.ValidateToken(idToken, validationParameters, out _);
        }
        catch (SecurityTokenException exception)
        {
            throw new UnauthorizedAccessException("Google token is invalid.", exception);
        }

        var subject = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var email = principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value
            ?? principal.FindFirst(ClaimTypes.Email)?.Value;
        var emailVerifiedValue = principal.FindFirst("email_verified")?.Value;
        var fullName = principal.FindFirst("name")?.Value
            ?? principal.FindFirst(ClaimTypes.Name)?.Value;
        var avatarUrl = principal.FindFirst("picture")?.Value;

        if (string.IsNullOrWhiteSpace(subject) || string.IsNullOrWhiteSpace(email))
        {
            throw new UnauthorizedAccessException("Google token does not contain required subject or email claims.");
        }

        var emailVerified = string.Equals(emailVerifiedValue, "true", StringComparison.OrdinalIgnoreCase);

        if (!emailVerified)
        {
            throw new UnauthorizedAccessException("Google email must be verified.");
        }

        return new GoogleUserInfo(
            subject,
            email.Trim().ToLowerInvariant(),
            emailVerified,
            string.IsNullOrWhiteSpace(fullName) ? email : fullName.Trim(),
            string.IsNullOrWhiteSpace(avatarUrl) ? null : avatarUrl.Trim());
    }
}
