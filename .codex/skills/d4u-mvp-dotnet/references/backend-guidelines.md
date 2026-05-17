# D4U Backend Guidelines

## Stack

- ASP.NET Core Web API targeting `net8.0`.
- PostgreSQL as the database.
- EF Core with Npgsql provider.
- Swagger/OpenAPI enabled in development.
- Controllers for HTTP boundary; services for business rules; DbContext for persistence.

## Code Style

- Use nullable reference types.
- Use PascalCase for C# types/properties and snake_case table/column names in PostgreSQL.
- Prefer `Guid` IDs.
- Prefer `DateTimeOffset` for new timestamp properties unless an existing file already uses `DateTime`.
- Keep controllers thin and return DTOs, not EF entities, when implementing real endpoints.
- Put validation close to command/request handling.

## EF Core Modeling

- Map enum properties as strings for readability unless performance dictates otherwise.
- Configure unique indexes from `D4U_ERD.dbml`.
- Configure decimal precision for money fields.
- Use explicit relationships for all foreign keys in the ERD.
- Keep soft-delete fields such as `DeletedAt` nullable.
- Seed `subscription_plans` and initial `design_categories`.

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
