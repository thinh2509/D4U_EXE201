namespace D4U.Api.Application.Common.Http;

public sealed record ApiResponse<T>(
    bool Success,
    T? Data,
    string Message,
    IReadOnlyList<string> Errors)
{
    public static ApiResponse<T> Ok(T? data, string message = "OK")
    {
        return new ApiResponse<T>(true, data, message, []);
    }

    public static ApiResponse<T> Fail(string message, IReadOnlyList<string>? errors = null)
    {
        return new ApiResponse<T>(false, default, message, errors ?? []);
    }
}
