namespace D4U.Api.Application.Features.Ai;

using FluentValidation;

public sealed class GenerateAiProposalRequestValidator : AbstractValidator<GenerateAiProposalRequest>
{
    public GenerateAiProposalRequestValidator()
    {
        RuleFor(request => request.ProjectId)
            .NotEmpty()
            .WithMessage("Vui lòng chọn dự án cần tạo proposal bằng AI.");
    }
}
