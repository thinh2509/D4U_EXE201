namespace D4U.Api.Infrastructure.Http;

using D4U.Api.Application.Common.Exceptions;
using D4U.Api.Application.Common.Http;
using Microsoft.EntityFrameworkCore;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (AppException exception)
        {
            await WriteApiResponseAsync(context, exception.StatusCode, exception.Message, exception.Errors);
        }
        catch (UnauthorizedAccessException exception)
        {
            await WriteApiResponseAsync(context, StatusCodes.Status401Unauthorized, exception.Message, [exception.Message]);
        }
        catch (InvalidOperationException exception)
        {
            await WriteApiResponseAsync(context, StatusCodes.Status400BadRequest, exception.Message, [exception.Message]);
        }
        catch (DbUpdateConcurrencyException)
        {
            await WriteApiResponseAsync(
                context,
                StatusCodes.Status409Conflict,
                "The project changed while the request was being processed. Refresh and try again.",
                ["The project changed while the request was being processed. Refresh and try again."]);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled request exception.");
            await WriteApiResponseAsync(
                context,
                StatusCodes.Status500InternalServerError,
                "An unexpected error occurred.",
                ["An unexpected error occurred."]);
        }
    }

    private static async Task WriteApiResponseAsync(
        HttpContext context,
        int statusCode,
        string message,
        IReadOnlyList<string> errors)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(message, errors));
    }
}
