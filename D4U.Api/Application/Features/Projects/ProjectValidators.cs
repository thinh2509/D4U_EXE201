namespace D4U.Api.Application.Features.Projects;

using FluentValidation;

public sealed class UpsertProjectDraftRequestValidator : AbstractValidator<UpsertProjectDraftRequest>
{
    public UpsertProjectDraftRequestValidator()
    {
        RuleFor(request => request.DesignCategoryId)
            .NotEmpty();

        RuleFor(request => request.Title)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(request => request.Brief)
            .NotEmpty()
            .MinimumLength(20);

        RuleFor(request => request.UsagePurpose)
            .MaximumLength(2000);

        RuleFor(request => request.BudgetAmount)
            .GreaterThan(0);

        RuleFor(request => request.Currency)
            .NotEmpty()
            .Equal("VND")
            .WithMessage("Only VND currency is supported in MVP.");

        RuleFor(request => request.TotalDeadlineAt)
            .Must(deadline => deadline > DateTimeOffset.UtcNow)
            .WithMessage("Total deadline must be in the future.");

        RuleFor(request => request.SketchDeadlineAt)
            .LessThanOrEqualTo(request => request.FinalDeadlineAt)
            .WithMessage("Sketch deadline must be before or equal to final deadline.");

        RuleFor(request => request.FinalDeadlineAt)
            .LessThanOrEqualTo(request => request.TotalDeadlineAt)
            .WithMessage("Final deadline must be before or equal to total deadline.");

        RuleFor(request => request.MaxRevisionRounds)
            .InclusiveBetween(0, 10);
    }
}

