namespace D4U.Api.Application.Features.Profiles;

using FluentValidation;

public sealed class UpsertStudentProfileRequestValidator : AbstractValidator<UpsertStudentProfileRequest>
{
    public UpsertStudentProfileRequestValidator()
    {
        RuleFor(request => request.School)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(request => request.Major)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(request => request.StudyStartYear)
            .InclusiveBetween(1900, DateTime.UtcNow.Year + 1);

        RuleFor(request => request.Bio)
            .MaximumLength(1000);
    }
}

public sealed class UpsertSmeProfileRequestValidator : AbstractValidator<UpsertSmeProfileRequest>
{
    public UpsertSmeProfileRequestValidator()
    {
        RuleFor(request => request.CompanyName)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(request => request.RepresentativeName)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(request => request.PhoneNumber)
            .NotEmpty()
            .MaximumLength(50)
            .Matches("^[0-9+().\\-\\s]+$")
            .WithMessage("Phone number contains invalid characters.");

        RuleFor(request => request.BusinessField)
            .NotEmpty()
            .MaximumLength(255);
    }
}

public sealed class SubmitStudentVerificationRequestValidator : AbstractValidator<SubmitStudentVerificationRequest>
{
    private static readonly string[] AllowedExtensions =
    [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "pdf",
        "zip"
    ];

    public SubmitStudentVerificationRequestValidator()
    {
        RuleFor(request => request.StorageProvider)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(request => request.Bucket)
            .MaximumLength(255);

        RuleFor(request => request.StorageKey)
            .NotEmpty();

        RuleFor(request => request.OriginalFilename)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(request => request.MimeType)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(request => request.FileExtension)
            .NotEmpty()
            .MaximumLength(20)
            .Must(extension => AllowedExtensions.Contains(extension.TrimStart('.').ToLowerInvariant()))
            .WithMessage("Verification document extension is not allowed.");

        RuleFor(request => request.FileSizeBytes)
            .InclusiveBetween(1, 20 * 1024 * 1024);

        RuleFor(request => request.Checksum)
            .MaximumLength(128);
    }
}

public sealed class RejectStudentVerificationRequestValidator : AbstractValidator<RejectStudentVerificationRequest>
{
    public RejectStudentVerificationRequestValidator()
    {
        RuleFor(request => request.RejectionReason)
            .NotEmpty()
            .MaximumLength(1000);
    }
}
