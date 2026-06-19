namespace D4U.Api.Application.Features.Students;

using FluentValidation;

public sealed class UpsertStudentSkillRequestValidator : AbstractValidator<UpsertStudentSkillRequest>
{
    public UpsertStudentSkillRequestValidator()
    {
        RuleFor(request => request.SkillName)
            .NotEmpty()
            .MaximumLength(150);

        RuleFor(request => request.YearsOfExperience)
            .InclusiveBetween(0, 60)
            .When(request => request.YearsOfExperience.HasValue);

        RuleFor(request => request.ExperienceNote)
            .MaximumLength(500);
    }
}

public sealed class UpsertStudentPortfolioItemRequestValidator : AbstractValidator<UpsertStudentPortfolioItemRequest>
{
    public UpsertStudentPortfolioItemRequestValidator()
    {
        RuleFor(request => request.Title)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(request => request.Description)
            .MaximumLength(4000);

        RuleFor(request => request.ProjectUrl)
            .NotEmpty()
            .WithMessage("Project URL là bắt buộc.")
            .Must(BeAbsoluteUrl)
            .WithMessage("Project URL phải là một liên kết hợp lệ.");

        RuleFor(request => request.ThumbnailUrl)
            .Must(BeAbsoluteUrl)
            .When(request => !string.IsNullOrWhiteSpace(request.ThumbnailUrl))
            .WithMessage("Thumbnail URL phải là một liên kết hợp lệ.");

        RuleFor(request => request.FileUrl)
            .Must(BeAbsoluteUrl)
            .When(request => !string.IsNullOrWhiteSpace(request.FileUrl))
            .WithMessage("File URL phải là một liên kết hợp lệ.");
    }

    private static bool BeAbsoluteUrl(string? value)
    {
        return Uri.TryCreate(value, UriKind.Absolute, out _);
    }
}
