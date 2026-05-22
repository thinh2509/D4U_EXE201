namespace D4U.Api.Application.Features.Ai;

using FluentValidation;

public sealed class AiProjectBriefAssistantRequestValidator : AbstractValidator<AiProjectBriefAssistantRequest>
{
    public AiProjectBriefAssistantRequestValidator()
    {
        RuleFor(request => request.RawIdea)
            .NotEmpty()
            .MinimumLength(20)
            .MaximumLength(3000);

        RuleFor(request => request.BusinessField)
            .MaximumLength(255);

        RuleFor(request => request.TargetAudience)
            .MaximumLength(255);

        RuleFor(request => request.PreferredStyle)
            .MaximumLength(255);

        RuleFor(request => request.BudgetAmount)
            .GreaterThan(0)
            .When(request => request.BudgetAmount.HasValue);

        RuleFor(request => request.TotalDeadline)
            .Must(deadline => !deadline.HasValue || deadline.Value > DateTimeOffset.UtcNow)
            .When(request => request.TotalDeadline.HasValue)
            .WithMessage("Total deadline must be in the future.");
    }
}
