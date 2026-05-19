using D4U.Api.Infrastructure;
using D4U.Api.Infrastructure.Http;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Host.AddD4ULogging();

builder.Services.AddControllers();
builder.Services.AddD4UInfrastructure(builder.Configuration);
builder.Services.AddD4USwagger();

var app = builder.Build();

if (app.Configuration.GetValue<bool>("D4U_APPLY_MIGRATIONS"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
    dbContext.Database.Migrate();
}

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

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "D4U.Api" }))
    .WithName("HealthCheck");

app.Run();
