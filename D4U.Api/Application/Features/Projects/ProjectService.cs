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

    public async Task<ProjectApplicationResponse> SubmitApplicationAsync(
        Guid userId,
        Guid projectId,
        SubmitProjectApplicationRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var studentProfile = await RequireVerifiedStudentProfileAsync(user, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);

        if (project.Status != ProjectStatus.OPEN || project.ProjectType != ProjectType.OPEN)
        {
            throw new InvalidOperationException("Students can apply only to open projects.");
        }

        if (project.SelectedStudentProfileId.HasValue)
        {
            throw new InvalidOperationException("Project already has a selected student.");
        }

        var applications = unitOfWork.Repository<ProjectApplication>();
        var hasExistingApplication = await applications.AnyAsync(
            application => application.ProjectId == projectId && application.StudentProfileId == studentProfile.Id,
            cancellationToken);

        if (hasExistingApplication)
        {
            throw new InvalidOperationException("Student has already applied to this project.");
        }

        var now = DateTimeOffset.UtcNow;
        var application = new ProjectApplication
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            StudentProfileId = studentProfile.Id,
            ProposedPrice = request.ProposedPrice,
            CoverLetter = request.CoverLetter.Trim(),
            EstimatedDurationDays = request.EstimatedDurationDays,
            Status = "SUBMITTED",
            SubmittedAt = now,
            UpdatedAt = now
        };

        await applications.AddAsync(application, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await ToApplicationResponseAsync(application, cancellationToken);
    }

    public async Task<IReadOnlyList<ProjectApplicationResponse>> ListApplicationsAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);

        if (project.SmeProfileId != smeProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the owner SME can view project applications.");
        }

        return await (
            from application in unitOfWork.Repository<ProjectApplication>().Query()
            join studentProfile in unitOfWork.Repository<StudentProfile>().Query()
                on application.StudentProfileId equals studentProfile.Id
            join studentUser in unitOfWork.Repository<User>().Query()
                on studentProfile.UserId equals studentUser.Id
            where application.ProjectId == projectId
            orderby application.SubmittedAt descending
            select new ProjectApplicationResponse(
                application.Id,
                application.ProjectId,
                application.StudentProfileId,
                studentUser.FullName,
                application.ProposedPrice,
                application.CoverLetter,
                application.EstimatedDurationDays,
                application.Status,
                application.SubmittedAt,
                application.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProjectOfferResponse> CreateOfferAsync(
        Guid userId,
        Guid projectId,
        CreateProjectOfferRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);

        if (project.SmeProfileId != smeProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the owner SME can create offers for this project.");
        }

        if (project.SelectedStudentProfileId.HasValue)
        {
            throw new InvalidOperationException("Project already has a selected student.");
        }

        if (project.Status is not (ProjectStatus.OPEN or ProjectStatus.DRAFT or ProjectStatus.PRIVATE_INVITED))
        {
            throw new InvalidOperationException("Project is not available for offer creation.");
        }

        var studentProfile = await RequireVerifiedStudentProfileByIdAsync(request.StudentProfileId, cancellationToken);
        ProjectApplication? application = null;

        if (request.ApplicationId.HasValue)
        {
            application = await unitOfWork.Repository<ProjectApplication>().GetByIdAsync(
                request.ApplicationId.Value,
                cancellationToken);

            if (application is null ||
                application.ProjectId != projectId ||
                application.StudentProfileId != request.StudentProfileId)
            {
                throw new InvalidOperationException("Application does not belong to this project and student.");
            }

            if (application.Status != "SUBMITTED")
            {
                throw new InvalidOperationException("Only submitted applications can be selected for offers.");
            }
        }
        else if (project.ProjectType == ProjectType.OPEN)
        {
            throw new InvalidOperationException("Open project offers must select an existing application.");
        }

        var hasPendingOffer = await unitOfWork.Repository<ProjectOffer>().AnyAsync(
            offer => offer.ProjectId == projectId &&
                offer.StudentProfileId == studentProfile.Id &&
                (offer.Status == OfferStatus.PENDING_PAYMENT || offer.Status == OfferStatus.WAITING_ACCEPTANCE),
            cancellationToken);

        if (hasPendingOffer)
        {
            throw new InvalidOperationException("A pending offer already exists for this student and project.");
        }

        var now = DateTimeOffset.UtcNow;
        var offer = new ProjectOffer
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            StudentProfileId = studentProfile.Id,
            ApplicationId = request.ApplicationId,
            Status = OfferStatus.PENDING_PAYMENT,
            OfferedAmount = request.OfferedAmount,
            ExpiresAt = request.ExpiresAt,
            CreatedAt = now
        };

        await unitOfWork.Repository<ProjectOffer>().AddAsync(offer, cancellationToken);

        if (application is not null)
        {
            application.Status = "SELECTED";
            application.UpdatedAt = now;
        }

        var previousStatus = project.Status;
        project.Status = ProjectStatus.OFFER_SELECTED;
        project.UpdatedAt = now;
        await AddStatusHistoryAsync(project.Id, previousStatus, ProjectStatus.OFFER_SELECTED, userId, "Project offer created.", cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToOfferResponse(offer);
    }

    public async Task<ProjectOfferResponse> AcceptOfferAsync(
        Guid userId,
        Guid offerId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var studentProfile = await RequireVerifiedStudentProfileAsync(user, cancellationToken);
        var offer = await RequireOfferAsync(offerId, cancellationToken);

        if (offer.StudentProfileId != studentProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the invited student can accept this offer.");
        }

        if (offer.Status != OfferStatus.WAITING_ACCEPTANCE)
        {
            throw new InvalidOperationException("Only funded offers waiting for acceptance can be accepted.");
        }

        var project = await RequireProjectAsync(offer.ProjectId, cancellationToken);
        var previousStatus = project.Status;
        var now = DateTimeOffset.UtcNow;

        offer.Status = OfferStatus.ACCEPTED;
        offer.AcceptedAt = now;
        project.SelectedStudentProfileId = studentProfile.Id;
        project.Status = ProjectStatus.IN_PROGRESS;
        project.AcceptedAt = now;
        project.UpdatedAt = now;

        await AddStatusHistoryAsync(project.Id, previousStatus, ProjectStatus.IN_PROGRESS, userId, "Student accepted funded offer.", cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToOfferResponse(offer);
    }

    public async Task<ProjectOfferResponse> RejectOfferAsync(
        Guid userId,
        Guid offerId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var studentProfile = await RequireVerifiedStudentProfileAsync(user, cancellationToken);
        var offer = await RequireOfferAsync(offerId, cancellationToken);

        if (offer.StudentProfileId != studentProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the invited student can reject this offer.");
        }

        if (offer.Status is not (OfferStatus.PENDING_PAYMENT or OfferStatus.WAITING_ACCEPTANCE))
        {
            throw new InvalidOperationException("Only pending offers can be rejected.");
        }

        offer.Status = OfferStatus.REJECTED;
        offer.RejectedAt = DateTimeOffset.UtcNow;

        if (offer.ApplicationId.HasValue)
        {
            var application = await unitOfWork.Repository<ProjectApplication>().GetByIdAsync(
                offer.ApplicationId.Value,
                cancellationToken);

            if (application is not null && application.Status == "SELECTED")
            {
                application.Status = "SUBMITTED";
                application.UpdatedAt = offer.RejectedAt.Value;
            }
        }

        var project = await RequireProjectAsync(offer.ProjectId, cancellationToken);

        if (project.Status == ProjectStatus.OFFER_SELECTED)
        {
            var previousStatus = project.Status;
            project.Status = project.ProjectType == ProjectType.OPEN
                ? ProjectStatus.OPEN
                : ProjectStatus.PRIVATE_INVITED;
            project.UpdatedAt = offer.RejectedAt.Value;

            await AddStatusHistoryAsync(project.Id, previousStatus, project.Status, userId, "Student rejected offer.", cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToOfferResponse(offer);
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

    private async Task<StudentProfile> RequireVerifiedStudentProfileAsync(
        User user,
        CancellationToken cancellationToken)
    {
        if (user.Role != UserRole.STUDENT)
        {
            throw new InvalidOperationException("Only STUDENT users can perform this action.");
        }

        var profile = await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
            studentProfile => studentProfile.UserId == user.Id,
            cancellationToken);

        if (profile is null)
        {
            throw new InvalidOperationException("Student profile must be created first.");
        }

        if (profile.VerificationStatus != "APPROVED")
        {
            throw new InvalidOperationException("Student must be verified before using marketplace actions.");
        }

        return profile;
    }

    private async Task<StudentProfile> RequireVerifiedStudentProfileByIdAsync(
        Guid studentProfileId,
        CancellationToken cancellationToken)
    {
        var profile = await unitOfWork.Repository<StudentProfile>().GetByIdAsync(studentProfileId, cancellationToken);

        if (profile is null)
        {
            throw new InvalidOperationException("Student profile was not found.");
        }

        if (profile.VerificationStatus != "APPROVED")
        {
            throw new InvalidOperationException("Student must be verified before receiving offers.");
        }

        return profile;
    }

    private async Task<Project> RequireProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var project = await unitOfWork.Repository<Project>().GetByIdAsync(projectId, cancellationToken);
        return project ?? throw new InvalidOperationException("Project was not found.");
    }

    private async Task<ProjectOffer> RequireOfferAsync(Guid offerId, CancellationToken cancellationToken)
    {
        var offer = await unitOfWork.Repository<ProjectOffer>().GetByIdAsync(offerId, cancellationToken);
        return offer ?? throw new InvalidOperationException("Project offer was not found.");
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

    private async Task<ProjectApplicationResponse> ToApplicationResponseAsync(
        ProjectApplication application,
        CancellationToken cancellationToken)
    {
        var studentProfile = await unitOfWork.Repository<StudentProfile>().GetByIdAsync(
            application.StudentProfileId,
            cancellationToken);

        var studentUser = studentProfile is null
            ? null
            : await unitOfWork.Repository<User>().GetByIdAsync(studentProfile.UserId, cancellationToken);

        return new ProjectApplicationResponse(
            application.Id,
            application.ProjectId,
            application.StudentProfileId,
            studentUser?.FullName ?? string.Empty,
            application.ProposedPrice,
            application.CoverLetter,
            application.EstimatedDurationDays,
            application.Status,
            application.SubmittedAt,
            application.UpdatedAt);
    }

    private static ProjectOfferResponse ToOfferResponse(ProjectOffer offer)
    {
        return new ProjectOfferResponse(
            offer.Id,
            offer.ProjectId,
            offer.StudentProfileId,
            offer.ApplicationId,
            offer.Status,
            offer.OfferedAmount,
            offer.ExpiresAt,
            offer.AcceptedAt,
            offer.RejectedAt,
            offer.RevokedAt,
            offer.CreatedAt);
    }
}
