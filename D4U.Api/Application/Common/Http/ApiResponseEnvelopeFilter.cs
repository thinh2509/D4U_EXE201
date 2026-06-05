namespace D4U.Api.Application.Common.Http;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

public sealed class ApiResponseEnvelopeFilter : IAsyncResultFilter
{
    public async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
    {
        if (context.Result is ObjectResult objectResult)
        {
            var valueType = objectResult.Value?.GetType() ?? typeof(object);

            if (!IsApiResponse(valueType) && !IsProblemDetails(valueType))
            {
                objectResult.Value = ApiResponse<object>.Ok(objectResult.Value, GetMessage(objectResult.StatusCode));
                objectResult.DeclaredType = typeof(ApiResponse<object>);
            }
        }

        await next();
    }

    private static bool IsApiResponse(Type type)
    {
        return type.IsGenericType && type.GetGenericTypeDefinition() == typeof(ApiResponse<>);
    }

    private static bool IsProblemDetails(Type type)
    {
        return typeof(ProblemDetails).IsAssignableFrom(type);
    }

    private static string GetMessage(int? statusCode)
    {
        return statusCode switch
        {
            StatusCodes.Status201Created => "Created",
            StatusCodes.Status204NoContent => "No Content",
            _ => "OK"
        };
    }
}
