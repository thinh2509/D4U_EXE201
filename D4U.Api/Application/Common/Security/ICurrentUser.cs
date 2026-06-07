namespace D4U.Api.Application.Common.Security;

using D4U.Api.Domain.Enums;

public interface ICurrentUser
{
    Guid? UserId { get; }

    UserRole? Role { get; }

    bool IsAuthenticated { get; }
}
