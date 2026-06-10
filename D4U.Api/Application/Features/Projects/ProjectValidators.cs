namespace D4U.Api.Application.Features.Projects;

using FluentValidation;

public sealed class UpsertProjectDraftRequestValidator : AbstractValidator<UpsertProjectDraftRequest>
{
    public UpsertProjectDraftRequestValidator()
    {
        RuleFor(request => request.DesignCategoryId)
            .NotEmpty()
            .WithMessage("Vui lòng chọn danh mục thiết kế.");

        RuleFor(request => request.Title)
            .NotEmpty()
            .WithMessage("Vui lòng nhập tiêu đề dự án.")
            .MaximumLength(255)
            .WithMessage("Tiêu đề dự án không được vượt quá 255 ký tự.");

        RuleFor(request => request.Brief)
            .NotEmpty()
            .WithMessage("Vui lòng nhập brief dự án.")
            .MinimumLength(20)
            .WithMessage("Brief dự án cần ít nhất 20 ký tự.");

        RuleFor(request => request.UsagePurpose)
            .MaximumLength(2000)
            .WithMessage("Mục đích sử dụng không được vượt quá 2000 ký tự.");

        RuleFor(request => request.BudgetAmount)
            .GreaterThan(0)
            .WithMessage("Ngân sách dự án phải lớn hơn 0.");

        RuleFor(request => request.Currency)
            .NotEmpty()
            .WithMessage("Vui lòng chọn đơn vị tiền tệ.")
            .Equal("VND")
            .WithMessage("Hiện tại D4U chỉ hỗ trợ đơn vị VND.");

        RuleFor(request => request.SketchDeadlineAt)
            .Must(deadline => deadline > DateTimeOffset.UtcNow.Add(OfferTimingPolicy.MinimumSketchLeadTime))
            .WithMessage("Hạn nộp Sketch phải sau thời điểm hiện tại ít nhất 2 ngày.")
            .LessThan(request => request.FinalDeadlineAt)
            .WithMessage("Hạn nộp Final phải sau hạn nộp Sketch.");

        RuleFor(request => request.FinalDeadlineAt)
            .Must(deadline => deadline > DateTimeOffset.UtcNow)
            .WithMessage("Hạn nộp Final phải sau thời điểm hiện tại.")
            .LessThan(request => request.TotalDeadlineAt)
            .WithMessage("Hạn hoàn tất review phải sau hạn nộp Final.");

        RuleFor(request => request.TotalDeadlineAt)
            .Must(deadline => deadline > DateTimeOffset.UtcNow)
            .WithMessage("Hạn hoàn tất review phải sau thời điểm hiện tại.");
    }
}

public sealed class SubmitProjectApplicationRequestValidator : AbstractValidator<SubmitProjectApplicationRequest>
{
    public SubmitProjectApplicationRequestValidator()
    {
        RuleFor(request => request.ProposedPrice)
            .GreaterThan(0)
            .WithMessage("Giá đề xuất phải lớn hơn 0.");

        RuleFor(request => request.CoverLetter)
            .NotEmpty()
            .WithMessage("Vui lòng nhập giải pháp đề xuất.")
            .MinimumLength(20)
            .WithMessage("Giải pháp đề xuất cần ít nhất 20 ký tự.")
            .MaximumLength(3000)
            .WithMessage("Giải pháp đề xuất không được vượt quá 3000 ký tự.");

        RuleFor(request => request.EstimatedDurationDays)
            .InclusiveBetween(1, 365)
            .WithMessage("Thời gian ước tính phải nằm trong khoảng từ 1 đến 365 ngày.")
            .When(request => request.EstimatedDurationDays.HasValue);
    }
}

public sealed class CancelProjectRequestValidator : AbstractValidator<CancelProjectRequest>
{
    public CancelProjectRequestValidator()
    {
        RuleFor(request => request.CancellationReason)
            .NotEmpty()
            .WithMessage("Vui lòng nhập lý do hủy dự án.")
            .MinimumLength(10)
            .WithMessage("Lý do hủy dự án cần ít nhất 10 ký tự.")
            .MaximumLength(500)
            .WithMessage("Lý do hủy dự án không được vượt quá 500 ký tự.");
    }
}

public sealed class UpdateProjectDeadlinesRequestValidator : AbstractValidator<UpdateProjectDeadlinesRequest>
{
    public UpdateProjectDeadlinesRequestValidator()
    {
        RuleFor(request => request.SketchDeadlineAt)
            .Must(deadline => deadline > DateTimeOffset.UtcNow.Add(OfferTimingPolicy.MinimumSketchLeadTime))
            .WithMessage("Hạn nộp Sketch phải sau thời điểm hiện tại ít nhất 2 ngày.")
            .LessThan(request => request.FinalDeadlineAt)
            .WithMessage("Hạn nộp Final phải sau hạn nộp Sketch.");

        RuleFor(request => request.FinalDeadlineAt)
            .Must(deadline => deadline > DateTimeOffset.UtcNow)
            .WithMessage("Hạn nộp Final phải sau thời điểm hiện tại.")
            .LessThan(request => request.TotalDeadlineAt)
            .WithMessage("Hạn hoàn tất review phải sau hạn nộp Final.");

        RuleFor(request => request.TotalDeadlineAt)
            .Must(deadline => deadline > DateTimeOffset.UtcNow)
            .WithMessage("Hạn hoàn tất review phải sau thời điểm hiện tại.");
    }
}

public sealed class CreateProjectOfferRequestValidator : AbstractValidator<CreateProjectOfferRequest>
{
    public CreateProjectOfferRequestValidator()
    {
        RuleFor(request => request.StudentProfileId)
            .NotEmpty();

        RuleFor(request => request.OfferedAmount)
            .GreaterThan(0)
            .WithMessage("Giá offer phải lớn hơn 0.");

        RuleFor(request => request.ExpiresAt)
            .Must(expiresAt => !expiresAt.HasValue || expiresAt.Value > DateTimeOffset.UtcNow)
            .WithMessage("Hạn phản hồi offer phải sau thời điểm hiện tại.");
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
            .WithMessage("Hạn nộp lại phải sau thời điểm hiện tại.");
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
            .WithMessage("Hạn upload lại phải sau thời điểm hiện tại.");
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
