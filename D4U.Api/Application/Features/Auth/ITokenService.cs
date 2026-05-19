namespace D4U.Api.Application.Features.Auth;

using D4U.Api.Domain.Entities;

public interface ITokenService
{
    string CreateAccessToken(User user);
}
