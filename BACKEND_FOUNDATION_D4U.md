# D4U Backend Foundation

This document describes the backend foundation services configured for the D4U MVP.

## Generic Repository

Use `IRepository<TEntity>` for simple aggregate persistence:

- Querying an entity set with EF Core.
- Loading one entity by id.
- Adding, updating, and removing entities.
- Keeping application services independent from direct `DbContext` usage.

Implementation:

- Interface: `D4U.Api/Application/Common/Data/IRepository.cs`
- EF implementation: `D4U.Api/Infrastructure/Persistence/EfRepository.cs`

## Unit of Work

Use `IUnitOfWork` when one use case changes multiple entities and must save them in one transaction boundary.

Typical flow:

```csharp
var projects = unitOfWork.Repository<Project>();
await projects.AddAsync(project, cancellationToken);
await unitOfWork.SaveChangesAsync(cancellationToken);
```

Implementation:

- Interface: `D4U.Api/Application/Common/Data/IUnitOfWork.cs`
- EF implementation: `D4U.Api/Infrastructure/Persistence/EfUnitOfWork.cs`

## EF Core vs Dapper

Use EF Core by default for MVP features.

Use EF Core when:

- Creating or updating entities.
- Working with relationships and tracked changes.
- Enforcing aggregate and workflow consistency.
- Running commands that belong to a transaction.
- Writing most application services.

Use Dapper only for targeted read/query paths when EF Core becomes too heavy.

Use Dapper when:

- Building read-only dashboards.
- Running optimized reporting queries.
- Returning flattened DTOs from joins.
- Query performance needs explicit SQL.

Do not use Dapper for core write workflows unless there is a measured reason.

Implementation:

- Interface: `D4U.Api/Application/Common/Data/IDapperConnectionFactory.cs`
- Npgsql implementation: `D4U.Api/Infrastructure/Persistence/NpgsqlDapperConnectionFactory.cs`

## Serilog

Serilog is configured as the application logging provider.

Default behavior:

- Reads settings from `Serilog` in `appsettings.json`.
- Writes structured logs to console.
- Enriches logs with request context.

Secrets and raw tokens must not be logged.

## Redis Cache

The API uses `IDistributedCache`.

Behavior:

- If `Redis:ConnectionString` is configured, use Redis.
- If Redis is not configured, fall back to in-memory distributed cache for local development.

Use cache for:

- Short-lived lookup data.
- Rate-limit counters.
- Idempotency keys.
- Read-heavy reference data.

Do not cache security decisions unless expiry and invalidation are clear.

## JWT Authentication

JWT Bearer authentication is registered.

Configure with:

```json
{
  "Jwt": {
    "Issuer": "d4u-api",
    "Audience": "d4u-client",
    "SigningKey": "replace-with-a-long-secret"
  }
}
```

Use environment variables or user secrets for real values.

## OAuth2

OAuth2 is registered as an optional external authentication scheme.

It is disabled by default:

```json
{
  "OAuth2": {
    "Enabled": false
  }
}
```

Enable it only after choosing the provider and setting authorization, token, user-info endpoint, client id, and client secret.
