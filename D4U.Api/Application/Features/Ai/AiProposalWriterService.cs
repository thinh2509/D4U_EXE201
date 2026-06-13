namespace D4U.Api.Application.Features.Ai;

using System.Text;
using D4U.Api.Application.Common.Data;
using D4U.Api.Application.Common.Exceptions;
using D4U.Api.Application.Features.FeaturePackages;
using D4U.Api.Application.Features.Students;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

public sealed class AiProposalWriterService(
    IUnitOfWork unitOfWork,
    IStudentCapabilityService studentCapabilityService,
    IAiProposalGenerator proposalGenerator,
    IFeatureEntitlementService featureEntitlementService) : IAiProposalWriterService
{
    public async Task<GenerateAiProposalResponse> GenerateProposalAsync(
        Guid userId,
        GenerateAiProposalRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireActiveStudentUserAsync(userId, cancellationToken);
        var studentProfile = await RequireVerifiedStudentProfileAsync(user.Id, cancellationToken);
        var project = await RequireProjectAsync(request.ProjectId, cancellationToken);
        var category = await RequireDesignCategoryAsync(project.DesignCategoryId, cancellationToken);

        EnsureProjectSupportsApplication(project);
        await EnsureStudentHasNotAppliedAsync(project.Id, studentProfile.Id, cancellationToken);

        var entitlement = await featureEntitlementService.EnsureUsableEntitlementAsync(
            userId,
            FeatureEntitlementCodes.StudentAiMatching,
            "tạo proposal bằng AI",
            cancellationToken);

        var capabilitySummary = await studentCapabilityService.GetStudentCapabilitySummaryAsync(
            studentProfile.Id,
            project.DesignCategoryId,
            cancellationToken);

        var proposal = await proposalGenerator.GenerateAsync(
            BuildGeneratorRequest(project, category.Name, capabilitySummary),
            cancellationToken);

        ValidateGeneratedProposal(proposal);

        var usageResult = await featureEntitlementService.ConsumeUsageAsync(
            entitlement.EntitlementId,
            1,
            "tạo proposal bằng AI",
            cancellationToken);

        return new GenerateAiProposalResponse(
            proposal.ProposalText.Trim(),
            proposal.Strengths,
            usageResult.RemainingUsage,
            proposal.Provider,
            proposal.Warnings);
    }

    private static AiProposalGeneratorRequest BuildGeneratorRequest(
        Project project,
        string designCategoryName,
        StudentCapabilitySummaryResponse capabilitySummary)
    {
        return new AiProposalGeneratorRequest(
            new AiProposalProjectContext(
                project.Id,
                project.Title,
                project.Brief,
                designCategoryName,
                project.BudgetAmount,
                project.Currency,
                project.SketchDeadlineAt,
                project.FinalDeadlineAt,
                project.TotalDeadlineAt),
            new AiProposalStudentContext(
                capabilitySummary.StudentProfileId,
                capabilitySummary.BasicProfileSummary.StudentUserId,
                capabilitySummary.BasicProfileSummary.FullName,
                capabilitySummary.BasicProfileSummary.School,
                capabilitySummary.BasicProfileSummary.Major,
                capabilitySummary.BasicProfileSummary.Bio,
                capabilitySummary.BasicProfileSummary.VerificationStatus,
                capabilitySummary.BasicProfileSummary.AverageRating,
                capabilitySummary.BasicProfileSummary.CompletedProjectsCount,
                capabilitySummary.SkillsSummary,
                capabilitySummary.HighlightedSkills
                    .Select(skill => skill.SkillName)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Take(6)
                    .ToList(),
                capabilitySummary.RelatedSkillsByCategory
                    .Select(skill => skill.SkillName)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Take(6)
                    .ToList(),
                capabilitySummary.PortfolioSummary,
                BuildFeaturedPortfolioSummary(capabilitySummary.FeaturedPortfolio)));
    }

    private static string BuildFeaturedPortfolioSummary(IReadOnlyList<StudentPortfolioItemResponse> featuredPortfolio)
    {
        if (featuredPortfolio.Count == 0)
        {
            return "Student chưa có portfolio nổi bật công khai.";
        }

        var builder = new StringBuilder();
        foreach (var item in featuredPortfolio.Take(3))
        {
            if (builder.Length > 0)
            {
                builder.Append(" | ");
            }

            builder.Append(item.Title);
            if (!string.IsNullOrWhiteSpace(item.DesignCategoryName))
            {
                builder.Append(" (");
                builder.Append(item.DesignCategoryName);
                builder.Append(')');
            }
        }

        return builder.ToString();
    }

    private static void ValidateGeneratedProposal(AiProposalGeneratorResponse proposal)
    {
        if (string.IsNullOrWhiteSpace(proposal.ProposalText))
        {
            throw new InvalidOperationException("AI không tạo được proposal hợp lệ. Vui lòng thử lại.");
        }

        var trimmed = proposal.ProposalText.Trim();
        if (trimmed.Length is < 20 or > 3000)
        {
            throw new InvalidOperationException("AI không tạo được proposal hợp lệ. Vui lòng thử lại.");
        }

        if (proposal.Strengths.Count == 0)
        {
            throw new InvalidOperationException("AI không tạo được proposal hợp lệ. Vui lòng thử lại.");
        }
    }

    private static void EnsureProjectSupportsApplication(Project project)
    {
        if (project.Status != ProjectStatus.OPEN || project.ProjectType != ProjectType.OPEN)
        {
            throw new ConflictException("Dự án không còn mở để tạo proposal ứng tuyển.");
        }

        if (project.TotalDeadlineAt <= DateTimeOffset.UtcNow)
        {
            throw new ConflictException("Dự án đã quá hạn và không còn nhận ứng tuyển.");
        }

        if (project.SelectedStudentProfileId.HasValue)
        {
            throw new ConflictException("Dự án này đã có Student được chọn.");
        }
    }

    private async Task EnsureStudentHasNotAppliedAsync(
        Guid projectId,
        Guid studentProfileId,
        CancellationToken cancellationToken)
    {
        var hasExistingApplication = await unitOfWork.Repository<ProjectApplication>().AnyAsync(
            application => application.ProjectId == projectId && application.StudentProfileId == studentProfileId,
            cancellationToken);

        if (hasExistingApplication)
        {
            throw new ConflictException("Bạn đã ứng tuyển dự án này rồi.");
        }
    }

    private async Task<User> RequireActiveStudentUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken)
            ?? throw new ForbiddenException("User was not found.");

        if (user.Role != UserRole.STUDENT)
        {
            throw new ForbiddenException("Only STUDENT users can generate AI proposals.");
        }

        if (user.Status != UserStatus.ACTIVE)
        {
            throw new ForbiddenException("Only ACTIVE students can generate AI proposals.");
        }

        return user;
    }

    private async Task<StudentProfile> RequireVerifiedStudentProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        var profile = await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
            studentProfile => studentProfile.UserId == userId,
            cancellationToken);

        if (profile is null)
        {
            throw new ForbiddenException("Student profile must be created first.");
        }

        if (!string.Equals(profile.VerificationStatus, "APPROVED", StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenException("Student must be verified before using AI proposal writer.");
        }

        return profile;
    }

    private async Task<Project> RequireProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var project = await unitOfWork.Repository<Project>().GetByIdAsync(projectId, cancellationToken);
        return project ?? throw new NotFoundException("Project was not found.");
    }

    private async Task<DesignCategory> RequireDesignCategoryAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        var category = await unitOfWork.Repository<DesignCategory>().FirstOrDefaultAsync(
            value => value.Id == categoryId && value.IsActive,
            cancellationToken);

        return category ?? throw new NotFoundException("Design category was not found.");
    }
}
