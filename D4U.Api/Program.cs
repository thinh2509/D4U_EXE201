using D4U.Api.Infrastructure;
using D4U.Api.Infrastructure.Authentication;
using D4U.Api.Infrastructure.Http;
using D4U.Api.Infrastructure.Persistence;
using D4U.Api.Hubs;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Host.AddD4ULogging();

builder.Services.AddControllers(options =>
    {
        options.Filters.Add<D4U.Api.Application.Common.Http.ApiResponseEnvelopeFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddD4UInfrastructure(builder.Configuration);
builder.Services.AddD4USwagger();

const string CorsPolicyName = "D4UConfiguredOrigins";
var allowedOrigins = (builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
    .Select(origin => origin.Trim().TrimEnd('/'))
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy
                .WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

if (app.Configuration.GetValue<bool>("D4U_APPLY_MIGRATIONS"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
    dbContext.Database.Migrate();
}

await app.Services.SeedD4UAdminAsync();
await app.Services.SeedD4UDemoAccountsAsync();

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (allowedOrigins.Length > 0)
{
    app.UseCors(CorsPolicyName);
}

app.UseAuthentication();
app.UseMiddleware<AccountStatusMiddleware>();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .AllowAnonymous();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications").RequireAuthorization();

app.Run();
