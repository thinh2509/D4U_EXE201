namespace D4U.Api.Application.Common.Exceptions;

public sealed class GoneException : AppException
{
    public GoneException(string message)
        : base(message, StatusCodes.Status410Gone)
    {
    }
}
