namespace D4U.Api.Application.Common.Exceptions;

public sealed class ForbiddenException : AppException
{
    public ForbiddenException(string message)
        : base(message, StatusCodes.Status403Forbidden)
    {
    }
}
