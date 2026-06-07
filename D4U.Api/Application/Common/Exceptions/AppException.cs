namespace D4U.Api.Application.Common.Exceptions;

public abstract class AppException : Exception
{
    protected AppException(string message, int statusCode, IReadOnlyList<string>? errors = null)
        : base(message)
    {
        StatusCode = statusCode;
        Errors = errors ?? [message];
    }

    public int StatusCode { get; }

    public IReadOnlyList<string> Errors { get; }
}
