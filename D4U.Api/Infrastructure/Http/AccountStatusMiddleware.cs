namespace D4U.Api.Infrastructure.Http;

using System.Security.Claims;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class AccountStatusMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, D4UDbContext dbContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userIdValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (Guid.TryParse(userIdValue, out var userId))
            {
                var status = await dbContext.Users
                    .AsNoTracking()
                    .Where(user => user.Id == userId)
                    .Select(user => user.Status)
                    .FirstOrDefaultAsync();

                if (status is UserStatus.SUSPENDED or UserStatus.BANNED or UserStatus.DELETED)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        title = "Forbidden",
                        detail = "Account is not allowed to perform protected actions."
                    });
                    return;
                }
            }
        }

        await next(context);
    }
}
