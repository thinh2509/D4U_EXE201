# D4U Backend Guidelines

## Stack

- ASP.NET Core Web API targeting `net8.0`.
- PostgreSQL as the database.
- EF Core with Npgsql provider.
- Swagger/OpenAPI enabled in development.
- Controllers for HTTP boundary; services for business rules; DbContext for persistence.
- JWT bearer authentication with refresh sessions.
- FluentValidation for request DTO validation.
- ProblemDetails for API errors.
- Built-in rate limiting for sensitive endpoints.

## Code Style

- Use nullable reference types.
- Use PascalCase for C# types/properties and snake_case table/column names in PostgreSQL.
- Prefer `Guid` IDs.
- Prefer `DateTimeOffset` for new timestamp properties unless an existing file already uses `DateTime`.
- Keep controllers thin and return DTOs, not EF entities, when implementing real endpoints.
- Put validation close to command/request handling.
- Use `/api/v1/...` route prefixes for MVP endpoints.
- Use `ProblemDetails` with stable error codes for business failures.

## EF Core Modeling

- Use EF Core Code First as the database implementation strategy.
- Treat `D4U_ERD.dbml` and `Entity_Dictionary_D4U.md` as design references.
- Make schema changes through entity/configuration changes and EF Core migrations.
- Use Fluent API for all meaningful database mappings.
- Prefer `IEntityTypeConfiguration<T>` classes in `Infrastructure/Persistence/Configurations`.
- Map enum properties as strings for readability unless performance dictates otherwise.
- Configure unique indexes from `D4U_ERD.dbml`.
- Configure decimal precision for money fields.
- Use explicit relationships for all foreign keys in the ERD.
- Keep soft-delete fields such as `DeletedAt` nullable.
- Seed `subscription_plans` and initial `design_categories`.
- Use `jsonb` for structured audit metadata when full mappings are implemented.

## Security and Infrastructure Defaults

- Use `PasswordHasher<TUser>` for MVP password hashing.
- Access token TTL: 15 minutes.
- Refresh token TTL: 14 days.
- Store refresh token hashes only.
- Use explicit CORS origins from configuration.
- Never trust client-submitted payment success; rely on provider webhook or mock provider confirmation.
- Payment provider integration should go through `IPaymentProvider`.
- File storage integration should go through an abstraction so local storage and object storage can be swapped.

## MVP Business Rules

- Student can apply only once per project.
- SME cannot publish beyond active open project limit or max budget for current plan.
- Project cannot start until escrow is funded and offer accepted.
- Every in-progress project has SKETCH and FINAL milestones.
- Final submission should follow approved or auto-approved sketch.
- Escrow in DISPUTED status cannot be released.
- Wallet balance must never go negative.
- Rating is allowed only within 7 days after project completion.

## Suggested Modules

- Auth
- Accounts
- Profiles
- Projects
- Applications
- Offers
- Payments
- Milestones
- Submissions
- Reviews
- Wallets
- Disputes
- Ratings
- Notifications
- Admin
