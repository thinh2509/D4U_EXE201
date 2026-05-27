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

public sealed class SubmitProjectApplicationRequestValidator : AbstractValidator<SubmitProjectApplicationRequest>
{
    public SubmitProjectApplicationRequestValidator()
    {
        RuleFor(request => request.ProposedPrice)
            .GreaterThan(0);

        RuleFor(request => request.CoverLetter)
            .NotEmpty()
            .MinimumLength(20)
            .MaximumLength(3000);

        RuleFor(request => request.EstimatedDurationDays)
            .InclusiveBetween(1, 365)
            .When(request => request.EstimatedDurationDays.HasValue);
    }
}

public sealed class CancelProjectRequestValidator : AbstractValidator<CancelProjectRequest>
{
    public CancelProjectRequestValidator()
    {
        RuleFor(request => request.CancellationReason)
            .MaximumLength(1000);
    }
}

public sealed class CreateProjectOfferRequestValidator : AbstractValidator<CreateProjectOfferRequest>
{
    public CreateProjectOfferRequestValidator()
    {
        RuleFor(request => request.StudentProfileId)
            .NotEmpty();

        RuleFor(request => request.OfferedAmount)
            .GreaterThan(0);

        RuleFor(request => request.ExpiresAt)
            .Must(expiresAt => !expiresAt.HasValue || expiresAt.Value > DateTimeOffset.UtcNow)
            .WithMessage("Offer expiration must be in the future.");
    }
}

public sealed class SubmitProjectSubmissionRequestValidator : AbstractValidator<SubmitProjectSubmissionRequest>
{
    public SubmitProjectSubmissionRequestValidator()
    {
        RuleFor(request => request.MilestoneType)
            .IsInEnum();

        RuleFor(request => request.Description)
            .MaximumLength(3000);

        RuleFor(request => request.Files)
            .NotEmpty();

        RuleForEach(request => request.Files)
            .SetValidator(new SubmissionFileRequestValidator());
    }
}

public sealed class SubmissionFileRequestValidator : AbstractValidator<SubmissionFileRequest>
{
    public SubmissionFileRequestValidator()
    {
        RuleFor(request => request.FileId)
            .NotEmpty();
    }
}

public sealed class ApproveSubmissionRequestValidator : AbstractValidator<ApproveSubmissionRequest>
{
    public ApproveSubmissionRequestValidator()
    {
        RuleFor(request => request.Comment)
            .MaximumLength(2000);
    }
}

public sealed class RequestRevisionRequestValidator : AbstractValidator<RequestRevisionRequest>
{
    public RequestRevisionRequestValidator()
    {
        RuleFor(request => request.RequestedChanges)
            .NotEmpty()
            .MaximumLength(3000);

        RuleFor(request => request.DueAt)
            .Must(dueAt => dueAt > DateTimeOffset.UtcNow)
            .WithMessage("Revision due date must be in the future.");
    }
}

public sealed class ReportInvalidFileRequestValidator : AbstractValidator<ReportInvalidFileRequest>
{
    public ReportInvalidFileRequestValidator()
    {
        RuleFor(request => request.Reason)
            .IsInEnum();

        RuleFor(request => request.Description)
            .MaximumLength(2000);

        RuleFor(request => request.ReuploadDueAt)
            .Must(dueAt => dueAt > DateTimeOffset.UtcNow)
            .WithMessage("Reupload due date must be in the future.");
    }
}

public sealed class AdminProjectDecisionRequestValidator : AbstractValidator<AdminProjectDecisionRequest>
{
    public AdminProjectDecisionRequestValidator()
    {
        RuleFor(request => request.Reason)
            .MaximumLength(2000);
    }
}
