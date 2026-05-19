namespace D4U.Api.Infrastructure.Authentication;

using System.Security.Cryptography;
using D4U.Api.Application.Features.Auth;

public sealed class RefreshTokenService : IRefreshTokenService
{
    public string CreateRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }

    public string Hash(string refreshToken)
    {
        var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToBase64String(bytes);
    }
}
