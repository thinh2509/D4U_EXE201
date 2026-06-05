using D4U.Api.Infrastructure;
using D4U.Api.Infrastructure.Authentication;
using D4U.Api.Infrastructure.Http;
using D4U.Api.Infrastructure.Persistence;
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

var app = builder.Build();

if (app.Configuration.GetValue<bool>("D4U_APPLY_MIGRATIONS"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
    dbContext.Database.Migrate();
}

await app.Services.SeedD4UAdminAsync();

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseMiddleware<AccountStatusMiddleware>();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .AllowAnonymous();
app.MapControllers();

app.Run();
