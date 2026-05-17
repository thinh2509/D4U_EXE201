# D4U Agent Workflow

Use this reference when coordinating multiple agents for D4U MVP implementation.

## Recommended Agent Roles

### Architect

Scope:

- Read MVP docs and ERD.
- Decide module boundaries.
- Review API contracts and state transitions.
- Identify post-MVP creep.

Output:

- Short implementation plan.
- Risks and assumptions.
- File ownership recommendations.

### Schema Worker

Scope:

- Own `Domain/Entities`, `Domain/Enums`, `Infrastructure/Persistence`.
- Implement EF Core entities, DbContext, configurations, and seeds.
- Create migrations after entity model stabilizes.

Avoid:

- Editing controllers or feature services unless asked.

### Feature Worker

Scope:

- Own one vertical feature at a time, for example Projects, Offers, Submissions, Wallets, or Disputes.
- Implement DTOs, services, controllers, and focused tests for that feature.

Avoid:

- Changing shared entity definitions without coordination with Schema Worker.

### QA Reviewer

Scope:

- Review feature implementation against MVP checklist.
- Look for broken state transitions, missing authorization, money movement bugs, and missing tests.
- Run build/tests and report exact failures.

## Parallelization Rules

- Give each worker a disjoint write scope.
- Do not run two workers against the same module files.
- Use Architect or QA as read-only agents when write boundaries are unclear.
- Keep immediate blocking work local instead of delegating it.

## Good Delegation Prompts

Schema worker:

```text
Use the D4U MVP .NET skill. Implement EF Core entity classes and DbContext mappings for the MVP-only ERD. Own only Domain/Entities, Domain/Enums, and Infrastructure/Persistence. Do not edit controllers.
```

Feature worker:

```text
Use the D4U MVP .NET skill. Implement the Projects vertical slice: DTOs, service, controller endpoints, and validation for create/publish/list/detail. Own only Application/Features/Projects and Controllers/ProjectsController.cs.
```

QA reviewer:

```text
Use the D4U MVP .NET skill. Review the current implementation against MVP_D4U.md and D4U_ERD.dbml. Do not edit files. Report bugs, missing rules, and test gaps.
```
