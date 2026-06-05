namespace D4U.Api.Application.Common.Exceptions;

public sealed class ValidationException : AppException
{
    public ValidationException(string message)
        : base(message, StatusCodes.Status422UnprocessableEntity)
    {
    }

    public ValidationException(string message, IReadOnlyList<string> errors)
        : base(message, StatusCodes.Status422UnprocessableEntity, errors)
    {
    }
}
