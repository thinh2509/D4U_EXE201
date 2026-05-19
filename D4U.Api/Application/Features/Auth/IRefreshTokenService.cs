namespace D4U.Api.Application.Features.Auth;

public interface IRefreshTokenService
{
    string CreateRefreshToken();

    string Hash(string refreshToken);
}
