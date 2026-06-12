using D4U.Api.Infrastructure;
using D4U.Api.Infrastructure.Authentication;
using D4U.Api.Infrastructure.Http;
using D4U.Api.Infrastructure.Persistence;
using D4U.Api.Hubs;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using System.Data.Common;
using System.Reflection;
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
    await TryBaselineLegacyMigrationHistoryAsync(dbContext, app.Lifetime.ApplicationStopping);
    await dbContext.Database.MigrateAsync(app.Lifetime.ApplicationStopping);
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

static async Task TryBaselineLegacyMigrationHistoryAsync(
    D4UDbContext dbContext,
    CancellationToken cancellationToken)
{
    var allMigrations = dbContext.GetService<IMigrationsAssembly>()
        .Migrations
        .Keys
        .OrderBy(migrationId => migrationId, StringComparer.Ordinal)
        .ToArray();
    var pendingMigrations = dbContext.Database.GetPendingMigrations().ToArray();

    if (allMigrations.Length == 0 || pendingMigrations.Length == 0 || pendingMigrations.Length != allMigrations.Length)
    {
        return;
    }

    var connection = dbContext.Database.GetDbConnection();
    await using var _ = await OpenConnectionAsync(connection, cancellationToken);

    if (!await HasLegacyLatestSchemaAsync(connection, cancellationToken))
    {
        return;
    }

    await using (var createHistoryCommand = connection.CreateCommand())
    {
        createHistoryCommand.CommandText =
            """
            CREATE TABLE IF NOT EXISTS public."__EFMigrationsHistory" (
                "MigrationId" character varying(150) NOT NULL,
                "ProductVersion" character varying(32) NOT NULL,
                CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
            );
            """;

        await createHistoryCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    await using var countCommand = connection.CreateCommand();
    countCommand.CommandText = "SELECT COUNT(*) FROM public.\"__EFMigrationsHistory\";";
    var historyCount = Convert.ToInt32(await countCommand.ExecuteScalarAsync(cancellationToken));

    if (historyCount > 0)
    {
        return;
    }

    var productVersion = typeof(DbContext).Assembly
        .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?
        .InformationalVersion
        .Split('+')[0]
        ?? typeof(DbContext).Assembly.GetName().Version?.ToString()
        ?? "8.0.11";

    foreach (var migrationId in allMigrations)
    {
        await using var insertCommand = connection.CreateCommand();
        insertCommand.CommandText =
            """
            INSERT INTO public."__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES (@migrationId, @productVersion)
            ON CONFLICT ("MigrationId") DO NOTHING;
            """;

        var migrationParameter = insertCommand.CreateParameter();
        migrationParameter.ParameterName = "@migrationId";
        migrationParameter.Value = migrationId;
        insertCommand.Parameters.Add(migrationParameter);

        var versionParameter = insertCommand.CreateParameter();
        versionParameter.ParameterName = "@productVersion";
        versionParameter.Value = productVersion;
        insertCommand.Parameters.Add(versionParameter);

        await insertCommand.ExecuteNonQueryAsync(cancellationToken);
    }
}

static async Task<bool> HasLegacyLatestSchemaAsync(DbConnection connection, CancellationToken cancellationToken)
{
    string[] requiredTables =
    [
        "users",
        "projects",
        "feature_package_purchases",
        "student_skills",
        "student_portfolio_items",
        "student_portfolio_item_skills"
    ];

    await using var command = connection.CreateCommand();
    command.CommandText =
        """
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY (@tableNames);
        """;

    var parameter = command.CreateParameter();
    parameter.ParameterName = "@tableNames";
    parameter.Value = requiredTables;
    command.Parameters.Add(parameter);

    var existingTableCount = Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
    return existingTableCount == requiredTables.Length;
}

static async Task<IAsyncDisposable> OpenConnectionAsync(DbConnection connection, CancellationToken cancellationToken)
{
    if (connection.State == System.Data.ConnectionState.Open)
    {
        return AsyncDisposable.Noop;
    }

    await connection.OpenAsync(cancellationToken);
    return new AsyncConnectionCloser(connection);
}

sealed class AsyncConnectionCloser(DbConnection connection) : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await connection.CloseAsync();
    }
}

sealed class AsyncDisposable : IAsyncDisposable
{
    public static readonly AsyncDisposable Noop = new();

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}
