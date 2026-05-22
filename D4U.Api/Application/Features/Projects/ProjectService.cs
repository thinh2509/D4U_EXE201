namespace D4U.Api.Application.Features.Projects;

using D4U.Api.Application.Common.Data;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

public sealed class ProjectService(IUnitOfWork unitOfWork) : IProjectService
{
    private const string BasicPlanCode = "BASIC";
    private const string ActiveSubscriptionStatus = "ACTIVE";

    public async Task<ProjectResponse> CreateDraftAsync(
        Guid userId,
        UpsertProjectDraftRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);
        var category = await RequireActiveCategoryAsync(request.DesignCategoryId, cancellationToken);
        ValidateProjectRules(request);

        var now = DateTimeOffset.UtcNow;
        var project = new Project
        {
            Id = Guid.NewGuid(),
            SmeProfileId = smeProfile.Id,
            CreatedAt = now,
            UpdatedAt = now,
            Status = ProjectStatus.DRAFT
        };

        ApplyDraft(project, request);

        await unitOfWork.Repository<Project>().AddAsync(project, cancellationToken);
        await AddStatusHistoryAsync(project.Id, null, ProjectStatus.DRAFT, userId, "Project draft created.", cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToProjectResponse(project, category);
    }

    public async Task<ProjectResponse> UpdateDraftAsync(
        Guid userId,
        Guid projectId,
        UpsertProjectDraftRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);

        if (project.SmeProfileId != smeProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the owner SME can update this project.");
        }

        if (project.Status != ProjectStatus.DRAFT)
        {
            throw new InvalidOperationException("Only draft projects can be updated.");
        }

        var category = await RequireActiveCategoryAsync(request.DesignCategoryId, cancellationToken);
        ValidateProjectRules(request);

        ApplyDraft(project, request);
        project.UpdatedAt = DateTimeOffset.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToProjectResponse(project, category);
    }

    public async Task<ProjectResponse> PublishAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);

        if (project.SmeProfileId != smeProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the owner SME can publish this project.");
        }

        if (project.Status != ProjectStatus.DRAFT)
        {
            throw new InvalidOperationException("Only draft projects can be published.");
        }

        if (project.ProjectType != ProjectType.OPEN)
        {
            throw new InvalidOperationException("Only open projects can be published in this MVP slice.");
        }

        var category = await RequireActiveCategoryAsync(project.DesignCategoryId, cancellationToken);
        var plan = await EnsureActiveSubscriptionPlanAsync(smeProfile.Id, cancellationToken);
        await EnforceSubscriptionLimitsAsync(smeProfile.Id, project.BudgetAmount, plan, cancellationToken);

        var previousStatus = project.Status;
        var now = DateTimeOffset.UtcNow;
        project.Status = ProjectStatus.OPEN;
        project.PublishedAt = now;
        project.UpdatedAt = now;
        smeProfile.ActiveOpenProjectCount = await CountOpenProjectsAsync(smeProfile.Id, cancellationToken) + 1;
        smeProfile.UpdatedAt = now;

        await AddStatusHistoryAsync(project.Id, previousStatus, ProjectStatus.OPEN, userId, "Project published.", cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToProjectResponse(project, category);
    }

    public async Task<IReadOnlyList<ProjectResponse>> ListOpenProjectsAsync(
        CancellationToken cancellationToken = default)
    {
        return await (
            from project in unitOfWork.Repository<Project>().Query()
            join category in unitOfWork.Repository<DesignCategory>().Query()
                on project.DesignCategoryId equals category.Id
            where project.Status == ProjectStatus.OPEN && project.ProjectType == ProjectType.OPEN
            orderby project.PublishedAt descending
            select new ProjectResponse(
                project.Id,
                project.SmeProfileId,
                project.DesignCategoryId,
                category.Name,
                project.Title,
                project.Brief,
                project.UsagePurpose,
                project.ProjectType,
                project.Status,
                project.BudgetAmount,
                project.Currency,
                project.TotalDeadlineAt,
                project.SketchDeadlineAt,
                project.FinalDeadlineAt,
                project.MaxRevisionRounds,
                project.CurrentRevisionRound,
                project.IsConfidential,
                project.AllowStudentPortfolio,
                project.PublishedAt,
                project.CreatedAt,
                project.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProjectResponse> GetProjectAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);

        if (project.Status != ProjectStatus.OPEN)
        {
            var isOwnerSme = false;

            if (user.Role == UserRole.SME)
            {
                var smeProfile = await unitOfWork.Repository<SmeProfile>().FirstOrDefaultAsync(
                    profile => profile.UserId == userId,
                    cancellationToken);

                isOwnerSme = smeProfile?.Id == project.SmeProfileId;
            }

            if (!isOwnerSme && user.Role != UserRole.ADMIN)
            {
                throw new UnauthorizedAccessException("This project is not available.");
            }
        }

        var category = await RequireActiveCategoryAsync(project.DesignCategoryId, cancellationToken);
        return ToProjectResponse(project, category);
    }

    private async Task<User> RequireUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken);
        return user ?? throw new UnauthorizedAccessException("User not found.");
    }

    private async Task<SmeProfile> RequireSmeProfileAsync(User user, CancellationToken cancellationToken)
    {
        if (user.Role != UserRole.SME)
        {
            throw new InvalidOperationException("Only SME users can manage projects.");
        }

        var profile = await unitOfWork.Repository<SmeProfile>().FirstOrDefaultAsync(
            smeProfile => smeProfile.UserId == user.Id,
            cancellationToken);

        return profile ?? throw new InvalidOperationException("SME profile must be created before managing projects.");
    }

    private async Task<Project> RequireProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var project = await unitOfWork.Repository<Project>().GetByIdAsync(projectId, cancellationToken);
        return project ?? throw new InvalidOperationException("Project was not found.");
    }

    private async Task<DesignCategory> RequireActiveCategoryAsync(Guid categoryId, CancellationToken cancellationToken)
    {
        var category = await unitOfWork.Repository<DesignCategory>().FirstOrDefaultAsync(
            designCategory => designCategory.Id == categoryId && designCategory.IsActive,
            cancellationToken);

        return category ?? throw new InvalidOperationException("Design category was not found or is inactive.");
    }

    private async Task<SubscriptionPlan> EnsureActiveSubscriptionPlanAsync(
        Guid smeProfileId,
        CancellationToken cancellationToken)
    {
        var subscription = await unitOfWork.Repository<SmeSubscription>().Query()
            .Where(value => value.SmeProfileId == smeProfileId && value.Status == ActiveSubscriptionStatus)
            .OrderByDescending(value => value.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (subscription is not null)
        {
            var existingPlan = await unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(
                subscription.SubscriptionPlanId,
                cancellationToken);

            return existingPlan ?? throw new InvalidOperationException("Active subscription plan was not found.");
        }

        var basicPlan = await unitOfWork.Repository<SubscriptionPlan>().FirstOrDefaultAsync(
            plan => plan.Code == BasicPlanCode && plan.IsActive,
            cancellationToken);

        if (basicPlan is null)
        {
            throw new InvalidOperationException("Basic subscription plan was not found.");
        }

        var now = DateTimeOffset.UtcNow;
        await unitOfWork.Repository<SmeSubscription>().AddAsync(
            new SmeSubscription
            {
                Id = Guid.NewGuid(),
                SmeProfileId = smeProfileId,
                SubscriptionPlanId = basicPlan.Id,
                Status = ActiveSubscriptionStatus,
                StartedAt = now,
                CreatedAt = now
            },
            cancellationToken);

        return basicPlan;
    }

    private async Task EnforceSubscriptionLimitsAsync(
        Guid smeProfileId,
        decimal projectBudget,
        SubscriptionPlan plan,
        CancellationToken cancellationToken)
    {
        if (plan.MaxProjectBudget.HasValue && projectBudget > plan.MaxProjectBudget.Value)
        {
            throw new InvalidOperationException("Project budget exceeds the current subscription plan limit.");
        }

        if (plan.MaxActiveOpenProjects.HasValue)
        {
            var activeOpenProjects = await CountOpenProjectsAsync(smeProfileId, cancellationToken);

            if (activeOpenProjects >= plan.MaxActiveOpenProjects.Value)
            {
                throw new InvalidOperationException("Active open project limit has been reached for the current subscription plan.");
            }
        }
    }

    private async Task<int> CountOpenProjectsAsync(Guid smeProfileId, CancellationToken cancellationToken)
    {
        return await unitOfWork.Repository<Project>().Query()
            .CountAsync(
                project => project.SmeProfileId == smeProfileId &&
                    project.Status == ProjectStatus.OPEN &&
                    project.ProjectType == ProjectType.OPEN,
                cancellationToken);
    }

    private async Task AddStatusHistoryAsync(
        Guid projectId,
        ProjectStatus? fromStatus,
        ProjectStatus toStatus,
        Guid changedByUserId,
        string reason,
        CancellationToken cancellationToken)
    {
        await unitOfWork.Repository<ProjectStatusHistory>().AddAsync(
            new ProjectStatusHistory
            {
                Id = Guid.NewGuid(),
                ProjectId = projectId,
                FromStatus = fromStatus,
                ToStatus = toStatus,
                ChangedByUserId = changedByUserId,
                ChangeReason = reason,
                CreatedAt = DateTimeOffset.UtcNow
            },
            cancellationToken);
    }

    private static void ValidateProjectRules(UpsertProjectDraftRequest request)
    {
        if (request.BudgetAmount <= 0)
        {
            throw new InvalidOperationException("Project budget must be greater than zero.");
        }

        if (request.SketchDeadlineAt > request.FinalDeadlineAt)
        {
            throw new InvalidOperationException("Sketch deadline must be before or equal to final deadline.");
        }

        if (request.FinalDeadlineAt > request.TotalDeadlineAt)
        {
            throw new InvalidOperationException("Final deadline must be before or equal to total deadline.");
        }
    }

    private static void ApplyDraft(Project project, UpsertProjectDraftRequest request)
    {
        project.DesignCategoryId = request.DesignCategoryId;
        project.Title = request.Title.Trim();
        project.Brief = request.Brief.Trim();
        project.UsagePurpose = string.IsNullOrWhiteSpace(request.UsagePurpose) ? null : request.UsagePurpose.Trim();
        project.ProjectType = request.ProjectType;
        project.BudgetAmount = request.BudgetAmount;
        project.Currency = request.Currency.Trim().ToUpperInvariant();
        project.TotalDeadlineAt = request.TotalDeadlineAt;
        project.SketchDeadlineAt = request.SketchDeadlineAt;
        project.FinalDeadlineAt = request.FinalDeadlineAt;
        project.MaxRevisionRounds = request.MaxRevisionRounds;
        project.IsConfidential = request.IsConfidential;
        project.AllowStudentPortfolio = request.AllowStudentPortfolio;
    }

    private static ProjectResponse ToProjectResponse(Project project, DesignCategory category)
    {
        return new ProjectResponse(
            project.Id,
            project.SmeProfileId,
            project.DesignCategoryId,
            category.Name,
            project.Title,
            project.Brief,
            project.UsagePurpose,
            project.ProjectType,
            project.Status,
            project.BudgetAmount,
            project.Currency,
            project.TotalDeadlineAt,
            project.SketchDeadlineAt,
            project.FinalDeadlineAt,
            project.MaxRevisionRounds,
            project.CurrentRevisionRound,
            project.IsConfidential,
            project.AllowStudentPortfolio,
            project.PublishedAt,
            project.CreatedAt,
            project.UpdatedAt);
    }
}

