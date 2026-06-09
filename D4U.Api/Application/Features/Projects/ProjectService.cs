namespace D4U.Api.Application.Features.Projects;

using D4U.Api.Application.Common.Data;
using D4U.Api.Application.Common.Exceptions;
using D4U.Api.Application.Common.Files;
using D4U.Api.Application.Features.MoneyMovement;
using D4U.Api.Application.Features.Notifications;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

public sealed class ProjectService(
    IUnitOfWork unitOfWork,
    IMoneyMovementService moneyMovementService,
    INotificationPublisher notificationPublisher,
    ILogger<ProjectService> logger) : IProjectService
{
    private const string BasicPlanCode = "BASIC";
    private const string ActiveSubscriptionStatus = "ACTIVE";
    private const int ReviewBusinessDays = 5;

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

    public async Task<ProjectResponse> UpdateDeadlinesAsync(
        Guid userId,
        Guid projectId,
        UpdateProjectDeadlinesRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);

        if (project.SmeProfileId != smeProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the owner SME can update project deadlines.");
        }

        if (project.Status is not (
            ProjectStatus.DRAFT or
            ProjectStatus.OPEN or
            ProjectStatus.PRIVATE_INVITED or
            ProjectStatus.OFFER_SELECTED))
        {
            throw new ConflictException("Project deadlines are locked after the offer is accepted.");
        }

        var blockingOfferExists = await unitOfWork.Repository<ProjectOffer>().AnyAsync(
            offer => offer.ProjectId == projectId &&
                (offer.Status == OfferStatus.ACCEPTED ||
                    offer.Status == OfferStatus.PENDING_PAYMENT ||
                    offer.Status == OfferStatus.PAYMENT_FAILED ||
                    offer.Status == OfferStatus.ACTIVE),
            cancellationToken);

        if (blockingOfferExists)
        {
            throw new ConflictException("Project deadlines are locked after the offer is accepted.");
        }

        ValidateDeadlineRules(
            request.SketchDeadlineAt,
            request.FinalDeadlineAt,
            request.TotalDeadlineAt);

        var waitingOffers = await unitOfWork.Repository<ProjectOffer>().Query()
            .Where(offer => offer.ProjectId == projectId && offer.Status == OfferStatus.WAITING_ACCEPTANCE)
            .ToListAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;

        if (waitingOffers.Count > 0 && request.SketchDeadlineAt - now < OfferTimingPolicy.MinimumSketchLeadTime)
        {
            throw new ConflictException(OfferTimingPolicy.SketchDeadlineTooCloseMessage);
        }

        var previousSketchDeadlineAt = project.SketchDeadlineAt;
        var previousFinalDeadlineAt = project.FinalDeadlineAt;
        var previousTotalDeadlineAt = project.TotalDeadlineAt;
        project.SketchDeadlineAt = request.SketchDeadlineAt;
        project.FinalDeadlineAt = request.FinalDeadlineAt;
        project.TotalDeadlineAt = request.TotalDeadlineAt;
        project.UpdatedAt = now;

        await unitOfWork.Repository<AuditLog>().AddAsync(
            new AuditLog
            {
                Id = Guid.NewGuid(),
                ActorUserId = userId,
                Action = "PROJECT_DEADLINES_UPDATED",
                EntityType = nameof(Project),
                EntityId = project.Id,
                BeforeJson = $$"""{"sketchDeadlineAt":"{{previousSketchDeadlineAt:O}}","finalDeadlineAt":"{{previousFinalDeadlineAt:O}}","totalDeadlineAt":"{{previousTotalDeadlineAt:O}}"}""",
                AfterJson = $$"""{"sketchDeadlineAt":"{{project.SketchDeadlineAt:O}}","finalDeadlineAt":"{{project.FinalDeadlineAt:O}}","totalDeadlineAt":"{{project.TotalDeadlineAt:O}}"}""",
                CreatedAt = now
            },
            cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        foreach (var waitingOffer in waitingOffers)
        {
            var studentUserId = await unitOfWork.Repository<StudentProfile>().Query()
                .Where(profile => profile.Id == waitingOffer.StudentProfileId)
                .Select(profile => profile.UserId)
                .FirstAsync(cancellationToken);

            await notificationPublisher.PublishAsync(
                studentUserId,
                userId,
                "PROJECT_DEADLINES_UPDATED",
                "Deadline dự án đã được cập nhật",
                $"SME đã cập nhật deadline dự án {project.Title}. Vui lòng kiểm tra lại trước khi chấp nhận offer.",
                nameof(ProjectOffer),
                waitingOffer.Id,
                now,
                cancellationToken);
        }

        var category = await RequireActiveCategoryAsync(project.DesignCategoryId, cancellationToken);
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
        EnsureProjectHasNotPassedTotalDeadline(project, now, "Project total deadline has passed. Update deadlines before publishing.");
        project.Status = ProjectStatus.OPEN;
        project.PublishedAt = now;
        project.UpdatedAt = now;
        smeProfile.ActiveOpenProjectCount = await CountOpenProjectsAsync(smeProfile.Id, cancellationToken) + 1;
        smeProfile.UpdatedAt = now;

        await AddStatusHistoryAsync(project.Id, previousStatus, ProjectStatus.OPEN, userId, "Project published.", cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToProjectResponse(project, category);
    }

    public async Task<ProjectResponse> CancelAsync(
        Guid userId,
        Guid projectId,
        CancelProjectRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);

        if (project.SmeProfileId != smeProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the owner SME can cancel this project.");
        }

        if (project.Status is not (ProjectStatus.DRAFT or ProjectStatus.OPEN))
        {
            throw new ConflictException("SME can cancel only draft or open projects in Outcome 1. Funded projects must continue or be handled by Admin.");
        }

        var category = await RequireActiveCategoryAsync(project.DesignCategoryId, cancellationToken);
        var previousStatus = project.Status;
        var now = DateTimeOffset.UtcNow;

        project.Status = ProjectStatus.CANCELLED;
        project.CancelledAt = now;
        project.CancellationReason = string.IsNullOrWhiteSpace(request.CancellationReason)
            ? "Cancelled by SME."
            : request.CancellationReason.Trim();
        project.UpdatedAt = now;

        if (previousStatus == ProjectStatus.OPEN)
        {
            smeProfile.ActiveOpenProjectCount = await CountOpenProjectsAsync(smeProfile.Id, cancellationToken) - 1;

            if (smeProfile.ActiveOpenProjectCount < 0)
            {
                smeProfile.ActiveOpenProjectCount = 0;
            }

            smeProfile.UpdatedAt = now;
        }

        await AddStatusHistoryAsync(project.Id, previousStatus, ProjectStatus.CANCELLED, userId, project.CancellationReason, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToProjectResponse(project, category);
    }

    public async Task<ProjectResponse> AbandonAsync(
        Guid userId,
        Guid projectId,
        CancelProjectRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var studentProfile = await RequireVerifiedStudentProfileAsync(user, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);

        if (project.SelectedStudentProfileId != studentProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the selected student can abandon this project.");
        }

        var reason = string.IsNullOrWhiteSpace(request.CancellationReason)
            ? throw new ValidationException("Abandon reason is required.")
            : request.CancellationReason.Trim();

        await moneyMovementService.CreateStudentAbandonRefundAsync(
            project.Id,
            userId,
            reason,
            cancellationToken);

        project = await RequireProjectAsync(projectId, cancellationToken);
        var category = await RequireActiveCategoryAsync(project.DesignCategoryId, cancellationToken);
        return ToProjectResponse(project, category);
    }

    public async Task<IReadOnlyList<ProjectResponse>> ListOpenProjectsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var studentProfile = user.Role == UserRole.STUDENT
            ? await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
                profile => profile.UserId == userId,
                cancellationToken)
            : null;

        var projects = await (
            from project in unitOfWork.Repository<Project>().Query()
            join category in unitOfWork.Repository<DesignCategory>().Query()
                on project.DesignCategoryId equals category.Id
            where project.Status == ProjectStatus.OPEN &&
                project.ProjectType == ProjectType.OPEN &&
                project.TotalDeadlineAt > now
            orderby project.PublishedAt descending
            select new { Project = project, Category = category })
            .ToListAsync(cancellationToken);

        var applicationsByProjectId = new Dictionary<Guid, ProjectApplication>();

        if (studentProfile is not null && projects.Count > 0)
        {
            var projectIds = projects.Select(value => value.Project.Id).ToList();
            var applications = await unitOfWork.Repository<ProjectApplication>().Query()
                .Where(application => application.StudentProfileId == studentProfile.Id && projectIds.Contains(application.ProjectId))
                .OrderBy(application => application.SubmittedAt)
                .ToListAsync(cancellationToken);

            applicationsByProjectId = applications
                .GroupBy(application => application.ProjectId)
                .ToDictionary(group => group.Key, group => group.First());
        }

        return projects
            .Select(value =>
            {
                applicationsByProjectId.TryGetValue(value.Project.Id, out var application);
                return ToProjectResponse(value.Project, value.Category, application is not null, application?.Id);
            })
            .ToList();
    }

    public async Task<IReadOnlyList<ProjectResponse>> ListMyProjectsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);

        return await (
            from project in unitOfWork.Repository<Project>().Query()
            join category in unitOfWork.Repository<DesignCategory>().Query()
                on project.DesignCategoryId equals category.Id
            where project.SmeProfileId == smeProfile.Id
            orderby project.UpdatedAt descending
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
                project.CurrentRevisionRound,
                project.IsConfidential,
                project.AllowStudentPortfolio,
                project.PublishedAt,
                project.CreatedAt,
                project.UpdatedAt,
                false,
                null))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProjectResponse> GetProjectAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);
        StudentProfile? studentProfile = null;

        if (user.Role == UserRole.STUDENT)
        {
            studentProfile = await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
                profile => profile.UserId == userId,
                cancellationToken);
        }

        if (project.Status != ProjectStatus.OPEN)
        {
            var isOwnerSme = false;
            var isRelatedStudent = false;

            if (user.Role == UserRole.SME)
            {
                var smeProfile = await unitOfWork.Repository<SmeProfile>().FirstOrDefaultAsync(
                    profile => profile.UserId == userId,
                    cancellationToken);

                isOwnerSme = smeProfile?.Id == project.SmeProfileId;
            }

            if (studentProfile is not null)
            {
                isRelatedStudent =
                    await unitOfWork.Repository<ProjectApplication>().AnyAsync(
                        value => value.ProjectId == projectId && value.StudentProfileId == studentProfile.Id,
                        cancellationToken) ||
                    await unitOfWork.Repository<ProjectOffer>().AnyAsync(
                        value => value.ProjectId == projectId && value.StudentProfileId == studentProfile.Id,
                        cancellationToken);
            }

            if (!isOwnerSme && !isRelatedStudent && user.Role != UserRole.ADMIN)
            {
                throw new UnauthorizedAccessException("This project is not available.");
            }
        }

        var category = await RequireActiveCategoryAsync(project.DesignCategoryId, cancellationToken);
        ProjectApplication? application = null;

        if (user.Role == UserRole.STUDENT)
        {
            if (studentProfile is not null)
            {
                application = await unitOfWork.Repository<ProjectApplication>().FirstOrDefaultAsync(
                    value => value.ProjectId == projectId && value.StudentProfileId == studentProfile.Id,
                    cancellationToken);
            }
        }

        return ToProjectResponse(project, category, application is not null, application?.Id);
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

        EnsureProjectHasNotPassedTotalDeadline(
            project,
            DateTimeOffset.UtcNow,
            "Project total deadline has passed. This project is no longer accepting applications.");

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
        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsDuplicateProjectApplication(exception))
        {
            throw new InvalidOperationException("Student has already applied to this project.", exception);
        }

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

    public async Task<IReadOnlyList<SmeProjectApplicationSummaryResponse>> ListMyApplicationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);

        return await (
            from application in unitOfWork.Repository<ProjectApplication>().Query()
            join project in unitOfWork.Repository<Project>().Query()
                on application.ProjectId equals project.Id
            join studentProfile in unitOfWork.Repository<StudentProfile>().Query()
                on application.StudentProfileId equals studentProfile.Id
            join studentUser in unitOfWork.Repository<User>().Query()
                on studentProfile.UserId equals studentUser.Id
            where project.SmeProfileId == smeProfile.Id
            orderby application.SubmittedAt descending
            select new SmeProjectApplicationSummaryResponse(
                application.Id,
                application.ProjectId,
                project.Title,
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

    public async Task<IReadOnlyList<StudentProjectApplicationSummaryResponse>> ListMyStudentApplicationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var studentProfile = await RequireVerifiedStudentProfileAsync(user, cancellationToken);

        var applications = await (
            from application in unitOfWork.Repository<ProjectApplication>().Query()
            join project in unitOfWork.Repository<Project>().Query()
                on application.ProjectId equals project.Id
            where application.StudentProfileId == studentProfile.Id
            orderby application.SubmittedAt descending
            select new
            {
                Application = application,
                ProjectTitle = project.Title
            })
            .ToListAsync(cancellationToken);

        var projectIds = applications.Select(value => value.Application.ProjectId).Distinct().ToList();
        var applicationIds = applications.Select(value => value.Application.Id).ToList();
        var offers = await unitOfWork.Repository<ProjectOffer>().Query()
            .Where(value => value.StudentProfileId == studentProfile.Id && projectIds.Contains(value.ProjectId))
            .ToListAsync(cancellationToken);
        var offersByApplicationId = offers
            .Where(value => value.ApplicationId.HasValue && applicationIds.Contains(value.ApplicationId.Value))
            .GroupBy(value => value.ApplicationId!.Value)
            .ToDictionary(value => value.Key, value => value.OrderByDescending(offer => offer.CreatedAt).First());
        var escrows = await unitOfWork.Repository<Escrow>().Query()
            .Where(value => value.StudentProfileId == studentProfile.Id && projectIds.Contains(value.ProjectId))
            .ToListAsync(cancellationToken);
        var escrowsByProjectId = escrows.ToDictionary(value => value.ProjectId);
        var paymentsByEscrowId = await GetLatestPaymentsByEscrowIdAsync(escrows.Select(value => value.Id).ToList(), cancellationToken);

        return applications
            .Select(value =>
            {
                offersByApplicationId.TryGetValue(value.Application.Id, out var offer);
                escrowsByProjectId.TryGetValue(value.Application.ProjectId, out var escrow);
                var payment = escrow is null ? null : paymentsByEscrowId.GetValueOrDefault(escrow.Id);

                return new StudentProjectApplicationSummaryResponse(
                    value.Application.Id,
                    value.Application.ProjectId,
                    value.ProjectTitle,
                    value.Application.Status,
                    value.Application.ProposedPrice,
                    value.Application.CoverLetter,
                    value.Application.EstimatedDurationDays,
                    value.Application.SubmittedAt,
                    value.Application.UpdatedAt,
                    offer?.Id,
                    offer?.Status,
                    offer?.OfferedAmount,
                    payment?.Status,
                    escrow?.Status);
            })
            .ToList();
    }

    public async Task<IReadOnlyList<ProjectOfferFlowResponse>> ListMyStudentOffersAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var studentProfile = await RequireVerifiedStudentProfileAsync(user, cancellationToken);
        var offers = await unitOfWork.Repository<ProjectOffer>().Query()
            .Where(value => value.StudentProfileId == studentProfile.Id)
            .OrderByDescending(value => value.CreatedAt)
            .ToListAsync(cancellationToken);

        return await ToOfferFlowResponsesAsync(offers, cancellationToken);
    }

    public async Task<IReadOnlyList<StudentProjectSummaryResponse>> ListMyStudentProjectsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var studentProfile = await RequireVerifiedStudentProfileAsync(user, cancellationToken);
        var projects = await unitOfWork.Repository<Project>().Query()
            .Where(value => value.SelectedStudentProfileId == studentProfile.Id)
            .OrderByDescending(value => value.UpdatedAt)
            .ToListAsync(cancellationToken);
        var projectIds = projects.Select(value => value.Id).ToList();
        var escrows = await unitOfWork.Repository<Escrow>().Query()
            .Where(value => value.StudentProfileId == studentProfile.Id && projectIds.Contains(value.ProjectId))
            .ToListAsync(cancellationToken);
        var escrowsByProjectId = escrows.ToDictionary(value => value.ProjectId);

        return projects
            .Select(project =>
            {
                escrowsByProjectId.TryGetValue(project.Id, out var escrow);
                return new StudentProjectSummaryResponse(
                    project.Id,
                    project.Title,
                    project.Status,
                    project.BudgetAmount,
                    project.Currency,
                    project.TotalDeadlineAt,
                    project.AcceptedAt,
                    escrow?.Id,
                    escrow?.Status);
            })
            .ToList();
    }

    public async Task<IReadOnlyList<ProjectOfferFlowResponse>> ListMySmeOffersAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);
        var projectIds = await unitOfWork.Repository<Project>().Query()
            .Where(value => value.SmeProfileId == smeProfile.Id)
            .Select(value => value.Id)
            .ToListAsync(cancellationToken);
        var offers = await unitOfWork.Repository<ProjectOffer>().Query()
            .Where(value => projectIds.Contains(value.ProjectId))
            .OrderByDescending(value => value.CreatedAt)
            .ToListAsync(cancellationToken);

        return await ToOfferFlowResponsesAsync(offers, cancellationToken);
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

        var now = DateTimeOffset.UtcNow;
        EnsureProjectHasNotPassedTotalDeadline(
            project,
            now,
            "Project total deadline has passed. Update deadlines before creating an offer.");

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
                (offer.Status == OfferStatus.WAITING_ACCEPTANCE ||
                    offer.Status == OfferStatus.ACCEPTED ||
                    offer.Status == OfferStatus.PENDING_PAYMENT ||
                    offer.Status == OfferStatus.PAYMENT_FAILED ||
                    offer.Status == OfferStatus.ACTIVE),
            cancellationToken);

        if (hasPendingOffer)
        {
            throw new InvalidOperationException("An active offer already exists for this student and project.");
        }

        if (project.SketchDeadlineAt - now < OfferTimingPolicy.MinimumSketchLeadTime)
        {
            throw new ConflictException(OfferTimingPolicy.SketchDeadlineTooCloseMessage);
        }

        var offer = new ProjectOffer
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            StudentProfileId = studentProfile.Id,
            ApplicationId = request.ApplicationId,
            Status = OfferStatus.WAITING_ACCEPTANCE,
            OfferedAmount = application?.ProposedPrice ?? request.OfferedAmount,
            ExpiresAt = now.Add(OfferTimingPolicy.StudentDecisionWindow),
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

        await notificationPublisher.PublishAsync(
            studentProfile.UserId,
            userId,
            "NEW_OFFER",
            "Bạn có offer mới",
            $"SME đã gửi offer cho dự án {project.Title}.",
            nameof(ProjectOffer),
            offer.Id,
            now,
            cancellationToken);

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
            throw new InvalidOperationException("Only offers waiting for student acceptance can be accepted.");
        }

        var project = await RequireProjectAsync(offer.ProjectId, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        if (offer.ExpiresAt.HasValue && offer.ExpiresAt.Value <= now)
        {
            OfferStateMachine.TransitionTo(offer, OfferStatus.EXPIRED, now);
            await ReleaseApplicationIfSelectedAsync(offer, now, cancellationToken);
            await ReleaseProjectIfNoActiveOfferAsync(project, offer.Id, userId, "Offer acceptance window expired.", now, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Offer acceptance window has expired.");
        }

        OfferStateMachine.TransitionTo(offer, OfferStatus.ACCEPTED, now);
        project.SelectedStudentProfileId = studentProfile.Id;
        project.AcceptedAt = now;
        project.UpdatedAt = now;

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

        if (offer.Status != OfferStatus.WAITING_ACCEPTANCE)
        {
            throw new InvalidOperationException("Only offers waiting for student decision can be rejected.");
        }

        var now = DateTimeOffset.UtcNow;
        OfferStateMachine.TransitionTo(offer, OfferStatus.REJECTED, now);

        if (offer.ApplicationId.HasValue)
        {
            var application = await unitOfWork.Repository<ProjectApplication>().GetByIdAsync(
                offer.ApplicationId.Value,
                cancellationToken);

            if (application is not null && application.Status == "SELECTED")
            {
                application.Status = "SUBMITTED";
                application.UpdatedAt = now;
            }
        }

        var project = await RequireProjectAsync(offer.ProjectId, cancellationToken);

        if (project.SelectedStudentProfileId == studentProfile.Id)
        {
            project.SelectedStudentProfileId = null;
            project.AcceptedAt = null;
        }

        await ReleaseProjectIfNoActiveOfferAsync(project, offer.Id, userId, "Student rejected offer.", now, cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToOfferResponse(offer);
    }

    public async Task<ProjectSubmissionResponse> SubmitProjectSubmissionAsync(
        Guid userId,
        Guid projectId,
        SubmitProjectSubmissionRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var studentProfile = await RequireVerifiedStudentProfileAsync(user, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);

        if (project.SelectedStudentProfileId != studentProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the selected student can submit files for this project.");
        }

        await EnsureFundedEscrowAsync(project.Id, studentProfile.Id, cancellationToken);
        EnsureSubmissionFilesProvided(request);

        var now = DateTimeOffset.UtcNow;
        var milestoneType = request.MilestoneType;
        var submissionType = milestoneType == SubmissionStage.SKETCH ? SubmissionType.SKETCH : SubmissionType.FINAL;
        var revisionRound = project.CurrentRevisionRound;

        if (now >= project.TotalDeadlineAt)
        {
            throw new ConflictException(
                "Hạn hoàn tất dự án đã qua. Dự án cần được Admin xem xét trước khi nhận thêm bản nộp.");
        }

        if (project.Status == ProjectStatus.REVISION_REQUESTED)
        {
            var previousSubmission = await GetLatestResubmissionRequiredSubmissionAsync(project.Id, cancellationToken)
                ?? throw new InvalidOperationException("Revision request was not found for this project.");

            if (previousSubmission.MilestoneType != milestoneType)
            {
                throw new InvalidOperationException("Revision must be submitted for the same milestone that SME requested.");
            }

            submissionType = SubmissionType.REVISION;
            revisionRound = project.CurrentRevisionRound;
        }
        else if (milestoneType == SubmissionStage.SKETCH)
        {
            if (project.Status != ProjectStatus.IN_PROGRESS)
            {
                throw new InvalidOperationException("Sketch can be submitted only after escrow is funded and project is in progress.");
            }

            if (await HasActiveSubmissionAsync(project.Id, SubmissionStage.SKETCH, cancellationToken))
            {
                throw new InvalidOperationException("Sketch submission is already waiting for review.");
            }
        }
        else
        {
            if (project.Status != ProjectStatus.IN_PROGRESS)
            {
                throw new InvalidOperationException("Final can be submitted only when project is in progress.");
            }

            if (!await HasApprovedSubmissionAsync(project.Id, SubmissionStage.SKETCH, cancellationToken))
            {
                throw new InvalidOperationException("Final can be submitted only after Sketch is approved.");
            }

            if (await HasActiveSubmissionAsync(project.Id, SubmissionStage.FINAL, cancellationToken))
            {
                throw new InvalidOperationException("Final submission is already waiting for review.");
            }
        }

        var submission = new ProjectSubmission
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            SubmittedByStudentId = studentProfile.Id,
            SubmissionType = submissionType,
            MilestoneType = milestoneType,
            RevisionRound = revisionRound,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Status = SubmissionStatus.SUBMITTED,
            SubmittedAt = now,
            ReviewDueAt = milestoneType == SubmissionStage.FINAL
                ? Min(AddBusinessDays(now, ReviewBusinessDays), project.TotalDeadlineAt)
                : AddBusinessDays(now, ReviewBusinessDays)
        };

        var files = await BuildSubmissionFilesAsync(submission.Id, userId, request.Files, now, cancellationToken);
        var previousStatus = project.Status;
        project.Status = milestoneType == SubmissionStage.SKETCH
            ? ProjectStatus.SKETCH_REVIEW
            : ProjectStatus.FINAL_REVIEW;
        project.UpdatedAt = now;

        await unitOfWork.Repository<ProjectSubmission>().AddAsync(submission, cancellationToken);

        foreach (var file in files)
        {
            await unitOfWork.Repository<SubmissionFile>().AddAsync(file, cancellationToken);
        }

        await AddStatusHistoryAsync(project.Id, previousStatus, project.Status, userId, $"{milestoneType} submitted for SME review.", cancellationToken);
        var smeOwnerUserId = await unitOfWork.Repository<SmeProfile>().Query()
            .Where(profile => profile.Id == project.SmeProfileId)
            .Select(profile => profile.UserId)
            .FirstAsync(cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await notificationPublisher.PublishAsync(
            smeOwnerUserId,
            userId,
            "NEW_SUBMISSION",
            "Student đã nộp bài mới",
            $"Student đã nộp {milestoneType} cho dự án {project.Title}.",
            nameof(ProjectSubmission),
            submission.Id,
            now,
            cancellationToken);

        return ToSubmissionResponse(submission, files);
    }

    public async Task<ProjectSubmissionResponse> ApproveSubmissionAsync(
        Guid userId,
        Guid projectId,
        Guid submissionId,
        ApproveSubmissionRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);
        EnsureSmeOwnsProject(project, smeProfile);
        var submission = await RequireSubmissionAsync(projectId, submissionId, cancellationToken);
        EnsureSubmissionCanBeReviewed(project, submission);

        var now = DateTimeOffset.UtcNow;
        var previousProjectStatus = project.Status;
        submission.Status = SubmissionStatus.APPROVED;
        submission.ApprovedAt = now;

        if (submission.MilestoneType == SubmissionStage.SKETCH)
        {
            project.Status = ProjectStatus.IN_PROGRESS;
            project.UpdatedAt = now;
        }
        else
        {
            await CompleteProjectExecutionAsync(project, now, cancellationToken);
        }

        await unitOfWork.Repository<ReviewAction>().AddAsync(
            new ReviewAction
            {
                Id = Guid.NewGuid(),
                ProjectId = project.Id,
                SubmissionId = submission.Id,
                ReviewerUserId = userId,
                Action = submission.MilestoneType == SubmissionStage.SKETCH
                    ? ReviewActionType.APPROVE_SKETCH
                    : ReviewActionType.APPROVE_FINAL,
                Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
                RevisionRound = submission.RevisionRound,
                CreatedAt = now
            },
            cancellationToken);

        await AddStatusHistoryAsync(project.Id, previousProjectStatus, project.Status, userId, $"{submission.MilestoneType} approved by SME.", cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await PublishReviewNotificationAsync(
            submission,
            userId,
            submission.MilestoneType == SubmissionStage.FINAL ? "Final đã được duyệt" : "Sketch đã được duyệt",
            $"SME đã duyệt {submission.MilestoneType} cho dự án {project.Title}.",
            now,
            cancellationToken);

        if (submission.MilestoneType == SubmissionStage.FINAL)
        {
            await TryReleaseProjectEscrowAsync(project.Id, userId, cancellationToken);
        }

        return await ToSubmissionResponseAsync(submission, cancellationToken);
    }

    public async Task<ProjectSubmissionResponse> RequestRevisionAsync(
        Guid userId,
        Guid projectId,
        Guid submissionId,
        RequestRevisionRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);
        EnsureSmeOwnsProject(project, smeProfile);
        var submission = await RequireSubmissionAsync(projectId, submissionId, cancellationToken);
        EnsureSubmissionCanBeReviewed(project, submission);

        if (string.IsNullOrWhiteSpace(request.RequestedChanges))
        {
            throw new InvalidOperationException("Requested changes are required.");
        }

        var now = DateTimeOffset.UtcNow;
        var previousProjectStatus = project.Status;

        project.CurrentRevisionRound += 1;
        var nextProjectStatus = project.CurrentRevisionRound >= project.MaxRevisionRounds
            ? ProjectStatus.ADMIN_REVIEW
            : ProjectStatus.REVISION_REQUESTED;
        project.Status = nextProjectStatus;
        project.UpdatedAt = now;
        submission.Status = SubmissionStatus.REVISION_REQUESTED;

        await unitOfWork.Repository<ReviewAction>().AddAsync(
            new ReviewAction
            {
                Id = Guid.NewGuid(),
                ProjectId = project.Id,
                SubmissionId = submission.Id,
                ReviewerUserId = userId,
                Action = ReviewActionType.REQUEST_REVISION,
                RequestedChanges = request.RequestedChanges.Trim(),
                RevisionRound = project.CurrentRevisionRound,
                DueAt = request.DueAt,
                CreatedAt = now
            },
            cancellationToken);

        await AddStatusHistoryAsync(
            project.Id,
            previousProjectStatus,
            nextProjectStatus,
            userId,
            nextProjectStatus == ProjectStatus.ADMIN_REVIEW
                ? "Revision limit reached; project moved to Admin review."
                : "SME requested revision.",
            cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await PublishReviewNotificationAsync(
            submission,
            userId,
            "SME yêu cầu chỉnh sửa",
            $"SME đã yêu cầu chỉnh sửa {submission.MilestoneType} cho dự án {project.Title}.",
            now,
            cancellationToken);
        return await ToSubmissionResponseAsync(submission, cancellationToken);
    }

    public async Task<ProjectSubmissionResponse> ReportInvalidFileAsync(
        Guid userId,
        Guid projectId,
        Guid submissionId,
        ReportInvalidFileRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var smeProfile = await RequireSmeProfileAsync(user, cancellationToken);
        var project = await RequireProjectAsync(projectId, cancellationToken);
        EnsureSmeOwnsProject(project, smeProfile);
        var submission = await RequireSubmissionAsync(projectId, submissionId, cancellationToken);
        EnsureSubmissionCanBeReviewed(project, submission);

        var now = DateTimeOffset.UtcNow;
        var previousProjectStatus = project.Status;
        project.Status = ProjectStatus.REVISION_REQUESTED;
        project.UpdatedAt = now;
        submission.Status = SubmissionStatus.INVALID_REPORTED;

        await unitOfWork.Repository<ReviewAction>().AddAsync(
            new ReviewAction
            {
                Id = Guid.NewGuid(),
                ProjectId = project.Id,
                SubmissionId = submission.Id,
                ReviewerUserId = userId,
                Action = ReviewActionType.REPORT_INVALID_FILE,
                Comment = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                RevisionRound = submission.RevisionRound,
                InvalidFileReason = request.Reason,
                ReuploadDueAt = request.ReuploadDueAt,
                CreatedAt = now
            },
            cancellationToken);

        await AddStatusHistoryAsync(project.Id, previousProjectStatus, ProjectStatus.REVISION_REQUESTED, userId, "SME reported invalid file.", cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await PublishReviewNotificationAsync(
            submission,
            userId,
            "File nộp không hợp lệ",
            $"SME đã báo file {submission.MilestoneType} không hợp lệ cho dự án {project.Title}.",
            now,
            cancellationToken);

        return await ToSubmissionResponseAsync(submission, cancellationToken);
    }

    public async Task<ProjectResponse> AdminForceCompleteAsync(
        Guid userId,
        Guid projectId,
        AdminProjectDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        EnsureAdmin(user);
        var project = await RequireProjectAsync(projectId, cancellationToken);

        if (project.Status != ProjectStatus.ADMIN_REVIEW)
        {
            throw new InvalidOperationException("Admin can force complete only projects in admin review.");
        }

        var latestSubmission = await RequireLatestSubmissionAsync(project.Id, cancellationToken);
        var category = await RequireActiveCategoryAsync(project.DesignCategoryId, cancellationToken);
        var previousStatus = project.Status;
        var now = DateTimeOffset.UtcNow;
        await CompleteProjectExecutionAsync(project, now, cancellationToken);

        await AddAdminReviewActionAsync(project, latestSubmission, userId, ReviewActionType.ADMIN_FORCE_COMPLETE, request.Reason, now, cancellationToken);
        await AddStatusHistoryAsync(project.Id, previousStatus, ProjectStatus.COMPLETED, userId, request.Reason ?? "Admin force completed project.", cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await TryReleaseProjectEscrowAsync(project.Id, userId, cancellationToken);

        return ToProjectResponse(project, category);
    }

    public async Task<ProjectResponse> AdminCancelInReviewAsync(
        Guid userId,
        Guid projectId,
        AdminProjectDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        EnsureAdmin(user);
        var project = await RequireProjectAsync(projectId, cancellationToken);

        if (project.Status != ProjectStatus.ADMIN_REVIEW)
        {
            throw new InvalidOperationException("Admin can cancel only projects in admin review.");
        }

        var latestSubmission = await RequireLatestSubmissionAsync(project.Id, cancellationToken);
        var category = await RequireActiveCategoryAsync(project.DesignCategoryId, cancellationToken);
        var previousStatus = project.Status;
        var now = DateTimeOffset.UtcNow;
        project.Status = ProjectStatus.CANCELLED;
        project.CancelledAt = now;
        project.CancellationReason = string.IsNullOrWhiteSpace(request.Reason)
            ? "Cancelled by Admin review."
            : request.Reason.Trim();
        project.UpdatedAt = now;

        await AddAdminReviewActionAsync(project, latestSubmission, userId, ReviewActionType.ADMIN_CANCEL, project.CancellationReason, now, cancellationToken);
        await AddStatusHistoryAsync(project.Id, previousStatus, ProjectStatus.CANCELLED, userId, project.CancellationReason, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToProjectResponse(project, category);
    }

    private async Task<IReadOnlyList<ProjectOfferFlowResponse>> ToOfferFlowResponsesAsync(
        IReadOnlyList<ProjectOffer> offers,
        CancellationToken cancellationToken)
    {
        if (offers.Count == 0)
        {
            return [];
        }

        var projectIds = offers.Select(value => value.ProjectId).Distinct().ToList();
        var studentProfileIds = offers.Select(value => value.StudentProfileId).Distinct().ToList();
        var applicationIds = offers
            .Where(value => value.ApplicationId.HasValue)
            .Select(value => value.ApplicationId!.Value)
            .Distinct()
            .ToList();
        var projects = await unitOfWork.Repository<Project>().Query()
            .Where(value => projectIds.Contains(value.Id))
            .ToListAsync(cancellationToken);
        var projectsById = projects.ToDictionary(value => value.Id);
        var studentProfiles = await unitOfWork.Repository<StudentProfile>().Query()
            .Where(value => studentProfileIds.Contains(value.Id))
            .ToListAsync(cancellationToken);
        var studentProfilesById = studentProfiles.ToDictionary(value => value.Id);
        var studentUserIds = studentProfiles.Select(value => value.UserId).Distinct().ToList();
        var studentUsers = await unitOfWork.Repository<User>().Query()
            .Where(value => studentUserIds.Contains(value.Id))
            .ToListAsync(cancellationToken);
        var studentUsersById = studentUsers.ToDictionary(value => value.Id);
        var applications = await unitOfWork.Repository<ProjectApplication>().Query()
            .Where(value => applicationIds.Contains(value.Id))
            .ToListAsync(cancellationToken);
        var applicationsById = applications.ToDictionary(value => value.Id);
        var escrows = await unitOfWork.Repository<Escrow>().Query()
            .Where(value => projectIds.Contains(value.ProjectId) && studentProfileIds.Contains(value.StudentProfileId))
            .ToListAsync(cancellationToken);
        var escrowsByProjectStudent = escrows.ToDictionary(value => (value.ProjectId, value.StudentProfileId));
        var paymentsByEscrowId = await GetLatestPaymentsByEscrowIdAsync(escrows.Select(value => value.Id).ToList(), cancellationToken);

        return offers
            .Select(offer =>
            {
                projectsById.TryGetValue(offer.ProjectId, out var project);
                studentProfilesById.TryGetValue(offer.StudentProfileId, out var studentProfile);
                var studentFullName = string.Empty;

                if (studentProfile is not null &&
                    studentUsersById.TryGetValue(studentProfile.UserId, out var studentUser))
                {
                    studentFullName = studentUser.FullName;
                }

                ProjectApplication? application = null;
                if (offer.ApplicationId.HasValue)
                {
                    applicationsById.TryGetValue(offer.ApplicationId.Value, out application);
                }

                escrowsByProjectStudent.TryGetValue((offer.ProjectId, offer.StudentProfileId), out var escrow);
                var payment = escrow is null ? null : paymentsByEscrowId.GetValueOrDefault(escrow.Id);

                return new ProjectOfferFlowResponse(
                    offer.Id,
                    offer.ProjectId,
                    project?.Title ?? string.Empty,
                    offer.StudentProfileId,
                    studentFullName,
                    offer.ApplicationId,
                    application?.Status,
                    offer.Status,
                    offer.OfferedAmount,
                    offer.ExpiresAt,
                    offer.PaymentDueAt,
                    offer.AcceptedAt,
                    offer.RejectedAt,
                    offer.CreatedAt,
                    payment?.Id,
                    payment?.Status,
                    escrow?.Id,
                    escrow?.Status,
                    payment?.CheckoutUrl,
                    payment?.ExpiresAt,
                    project?.SketchDeadlineAt ?? default,
                    project?.FinalDeadlineAt ?? default,
                    project?.TotalDeadlineAt ?? default);
            })
            .ToList();
    }

    private async Task<IReadOnlyDictionary<Guid, Payment>> GetLatestPaymentsByEscrowIdAsync(
        IReadOnlyList<Guid> escrowIds,
        CancellationToken cancellationToken)
    {
        if (escrowIds.Count == 0)
        {
            return new Dictionary<Guid, Payment>();
        }

        var payments = await unitOfWork.Repository<Payment>().Query()
            .Where(value => value.EscrowId.HasValue && escrowIds.Contains(value.EscrowId.Value))
            .OrderByDescending(value => value.CreatedAt)
            .ToListAsync(cancellationToken);

        return payments
            .GroupBy(value => value.EscrowId!.Value)
            .ToDictionary(value => value.Key, value => value.First());
    }

    private async Task ReleaseProjectIfNoActiveOfferAsync(
        Project project,
        Guid ignoredOfferId,
        Guid actorUserId,
        string reason,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (project.Status != ProjectStatus.OFFER_SELECTED)
        {
            project.UpdatedAt = now;
            return;
        }

        var hasOtherActiveOffer = await unitOfWork.Repository<ProjectOffer>().AnyAsync(
            value => value.ProjectId == project.Id &&
                value.Id != ignoredOfferId &&
                (value.Status == OfferStatus.WAITING_ACCEPTANCE ||
                    value.Status == OfferStatus.ACCEPTED ||
                    value.Status == OfferStatus.PENDING_PAYMENT ||
                    value.Status == OfferStatus.PAYMENT_FAILED ||
                    value.Status == OfferStatus.ACTIVE),
            cancellationToken);

        if (hasOtherActiveOffer)
        {
            project.UpdatedAt = now;
            return;
        }

        var previousStatus = project.Status;
        project.Status = project.ProjectType == ProjectType.OPEN
            ? ProjectStatus.OPEN
            : ProjectStatus.PRIVATE_INVITED;
        project.UpdatedAt = now;

        await AddStatusHistoryAsync(project.Id, previousStatus, project.Status, actorUserId, reason, cancellationToken);
    }

    private async Task ReleaseApplicationIfSelectedAsync(
        ProjectOffer offer,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (!offer.ApplicationId.HasValue)
        {
            return;
        }

        var application = await unitOfWork.Repository<ProjectApplication>().GetByIdAsync(
            offer.ApplicationId.Value,
            cancellationToken);

        if (application is not null && application.Status == "SELECTED")
        {
            application.Status = "SUBMITTED";
            application.UpdatedAt = now;
        }
    }

    private async Task EnsureFundedEscrowAsync(
        Guid projectId,
        Guid studentProfileId,
        CancellationToken cancellationToken)
    {
        var escrow = await unitOfWork.Repository<Escrow>().FirstOrDefaultAsync(
            value => value.ProjectId == projectId &&
                value.StudentProfileId == studentProfileId &&
                value.Status == EscrowStatus.FUNDED,
            cancellationToken);

        if (escrow is null)
        {
            throw new InvalidOperationException("Project cannot receive submissions until escrow is funded.");
        }
    }

    private async Task CompleteProjectExecutionAsync(
        Project project,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        project.Status = ProjectStatus.COMPLETED;
        project.CompletedAt ??= now;
        project.RatingDueAt ??= now.AddDays(7);
        project.UpdatedAt = now;

        var escrow = await unitOfWork.Repository<Escrow>().FirstOrDefaultAsync(
            value => value.ProjectId == project.Id && value.Status == EscrowStatus.FUNDED,
            cancellationToken);

        if (escrow is not null)
        {
            escrow.Status = EscrowStatus.RELEASE_PENDING;
            escrow.UpdatedAt = now;
        }
    }

    private async Task TryReleaseProjectEscrowAsync(
        Guid projectId,
        Guid? actorUserId,
        CancellationToken cancellationToken)
    {
        try
        {
            await moneyMovementService.ReleaseProjectEscrowAsync(projectId, actorUserId, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Immediate escrow release failed for completed project {ProjectId}. The background service will retry.",
                projectId);
        }
    }

    private async Task<IReadOnlyList<SubmissionFile>> BuildSubmissionFilesAsync(
        Guid submissionId,
        Guid userId,
        IReadOnlyList<SubmissionFileRequest> requests,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var result = new List<SubmissionFile>(requests.Count);
        var seenFileIds = new HashSet<Guid>();

        foreach (var request in requests)
        {
            if (!seenFileIds.Add(request.FileId))
            {
                throw new InvalidOperationException("Submission contains duplicate files.");
            }

            await EnsureAllowedSubmissionFileAsync(request.FileId, userId, cancellationToken);

            if (request.WatermarkedFileId.HasValue)
            {
                await EnsureAllowedSubmissionFileAsync(request.WatermarkedFileId.Value, userId, cancellationToken);
            }

            result.Add(new SubmissionFile
            {
                Id = Guid.NewGuid(),
                SubmissionId = submissionId,
                FileId = request.FileId,
                WatermarkedFileId = request.WatermarkedFileId,
                IsOriginalDownloadable = request.IsOriginalDownloadable,
                CreatedAt = now
            });
        }

        return result;
    }

    private async Task EnsureAllowedSubmissionFileAsync(
        Guid fileId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var file = await unitOfWork.Repository<FileAsset>().GetByIdAsync(fileId, cancellationToken)
            ?? throw new InvalidOperationException("Submission file was not found.");

        if (file.DeletedAt is not null)
        {
            throw new InvalidOperationException("Deleted files cannot be submitted.");
        }

        if (file.OwnerUserId != userId)
        {
            throw new UnauthorizedAccessException("Submission file belongs to another user.");
        }

        if (!FileMetadataRules.IsAllowedExtension(file.FileExtension))
        {
            throw new InvalidOperationException("Submission files must be jpg, png, or pdf.");
        }
    }

    private async Task<bool> HasActiveSubmissionAsync(
        Guid projectId,
        SubmissionStage milestoneType,
        CancellationToken cancellationToken)
    {
        return await unitOfWork.Repository<ProjectSubmission>().AnyAsync(
            value => value.ProjectId == projectId &&
                value.MilestoneType == milestoneType &&
                value.Status == SubmissionStatus.SUBMITTED,
            cancellationToken);
    }

    private async Task<bool> HasApprovedSubmissionAsync(
        Guid projectId,
        SubmissionStage milestoneType,
        CancellationToken cancellationToken)
    {
        return await unitOfWork.Repository<ProjectSubmission>().AnyAsync(
            value => value.ProjectId == projectId &&
                value.MilestoneType == milestoneType &&
                value.Status == SubmissionStatus.APPROVED,
            cancellationToken);
    }

    private async Task<ProjectSubmission?> GetLatestResubmissionRequiredSubmissionAsync(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        return await unitOfWork.Repository<ProjectSubmission>().Query()
            .Where(value => value.ProjectId == projectId &&
                (value.Status == SubmissionStatus.REVISION_REQUESTED ||
                 value.Status == SubmissionStatus.INVALID_REPORTED))
            .OrderByDescending(value => value.SubmittedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<ProjectSubmission> RequireSubmissionAsync(
        Guid projectId,
        Guid submissionId,
        CancellationToken cancellationToken)
    {
        return await unitOfWork.Repository<ProjectSubmission>().FirstOrDefaultAsync(
            value => value.Id == submissionId && value.ProjectId == projectId,
            cancellationToken) ?? throw new InvalidOperationException("Project submission was not found.");
    }

    private async Task<ProjectSubmission> RequireLatestSubmissionAsync(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        return await unitOfWork.Repository<ProjectSubmission>().Query()
            .Where(value => value.ProjectId == projectId)
            .OrderByDescending(value => value.SubmittedAt)
            .FirstOrDefaultAsync(cancellationToken) ?? throw new InvalidOperationException("Project has no submission to review.");
    }

    private async Task<ProjectSubmissionResponse> ToSubmissionResponseAsync(
        ProjectSubmission submission,
        CancellationToken cancellationToken)
    {
        var files = await unitOfWork.Repository<SubmissionFile>().Query()
            .Where(value => value.SubmissionId == submission.Id)
            .OrderBy(value => value.CreatedAt)
            .ToListAsync(cancellationToken);

        return ToSubmissionResponse(submission, files);
    }

    private static void EnsureSubmissionFilesProvided(SubmitProjectSubmissionRequest request)
    {
        if (request.Files is null || request.Files.Count == 0)
        {
            throw new InvalidOperationException("At least one submission file is required.");
        }
    }

    private static void EnsureSmeOwnsProject(Project project, SmeProfile smeProfile)
    {
        if (project.SmeProfileId != smeProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the owner SME can review this project.");
        }
    }

    private static void EnsureSubmissionCanBeReviewed(Project project, ProjectSubmission submission)
    {
        if (submission.Status is not SubmissionStatus.SUBMITTED and not SubmissionStatus.VALID)
        {
            throw new InvalidOperationException("Only submitted files waiting for review can be reviewed.");
        }

        if (submission.MilestoneType == SubmissionStage.SKETCH && project.Status != ProjectStatus.SKETCH_REVIEW)
        {
            throw new InvalidOperationException("Sketch can be reviewed only while project is in sketch review.");
        }

        if (submission.MilestoneType == SubmissionStage.FINAL && project.Status != ProjectStatus.FINAL_REVIEW)
        {
            throw new InvalidOperationException("Final can be reviewed only while project is in final review.");
        }
    }

    private static void EnsureAdmin(User user)
    {
        if (user.Role != UserRole.ADMIN)
        {
            throw new UnauthorizedAccessException("Only Admin users can perform this action.");
        }
    }

    private async Task AddAdminReviewActionAsync(
        Project project,
        ProjectSubmission submission,
        Guid adminUserId,
        ReviewActionType actionType,
        string? reason,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await unitOfWork.Repository<ReviewAction>().AddAsync(
            new ReviewAction
            {
                Id = Guid.NewGuid(),
                ProjectId = project.Id,
                SubmissionId = submission.Id,
                ReviewerUserId = adminUserId,
                Action = actionType,
                Comment = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim(),
                RevisionRound = submission.RevisionRound,
                MetadataJson = $$"""{"reason":"ADMIN_REVIEW"}""",
                CreatedAt = now
            },
            cancellationToken);
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
        var smeProfile = await unitOfWork.Repository<SmeProfile>().GetByIdAsync(smeProfileId, cancellationToken)
            ?? throw new InvalidOperationException("SME profile was not found.");

        if (smeProfile.SubscriptionPlanId != Guid.Empty)
        {
            var existingPlan = await unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(
                smeProfile.SubscriptionPlanId,
                cancellationToken);

            if (existingPlan is not null && existingPlan.IsActive)
            {
                return existingPlan;
            }
        }

        var basicPlan = await unitOfWork.Repository<SubscriptionPlan>().FirstOrDefaultAsync(
            plan => plan.Code == BasicPlanCode && plan.IsActive,
            cancellationToken);

        if (basicPlan is null)
        {
            throw new InvalidOperationException("Basic subscription plan was not found.");
        }

        var now = DateTimeOffset.UtcNow;
        smeProfile.SubscriptionPlanId = basicPlan.Id;
        smeProfile.SubscriptionStartedAt = smeProfile.SubscriptionStartedAt == default ? now : smeProfile.SubscriptionStartedAt;
        smeProfile.UpdatedAt = now;

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
        await unitOfWork.Repository<AuditLog>().AddAsync(
            new AuditLog
            {
                Id = Guid.NewGuid(),
                ActorUserId = changedByUserId,
                Action = "PROJECT_STATUS_CHANGED",
                EntityType = nameof(Project),
                EntityId = projectId,
                BeforeJson = fromStatus is null ? null : $$"""{"status":"{{fromStatus}}"}""",
                AfterJson = $$"""{"status":"{{toStatus}}","reason":"{{reason}}"}""",
                CreatedAt = DateTimeOffset.UtcNow
            },
            cancellationToken);
    }

    private async Task PublishReviewNotificationAsync(
        ProjectSubmission submission,
        Guid actorUserId,
        string title,
        string body,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var studentUserId = await unitOfWork.Repository<StudentProfile>().Query()
            .Where(profile => profile.Id == submission.SubmittedByStudentId)
            .Select(profile => profile.UserId)
            .FirstAsync(cancellationToken);

        await notificationPublisher.PublishAsync(
            studentUserId,
            actorUserId,
            "REVIEW_ACTION",
            title,
            body,
            nameof(ProjectSubmission),
            submission.Id,
            now,
            cancellationToken);
    }

    private static bool IsDuplicateProjectApplication(DbUpdateException exception)
    {
        return exception.ToString().Contains(
            "IX_project_applications_project_id_student_profile_id",
            StringComparison.OrdinalIgnoreCase);
    }

    private static void ValidateProjectRules(UpsertProjectDraftRequest request)
    {
        if (request.BudgetAmount <= 0)
        {
            throw new InvalidOperationException("Project budget must be greater than zero.");
        }

        ValidateDeadlineRules(
            request.SketchDeadlineAt,
            request.FinalDeadlineAt,
            request.TotalDeadlineAt);
    }

    private static void ValidateDeadlineRules(
        DateTimeOffset sketchDeadlineAt,
        DateTimeOffset finalDeadlineAt,
        DateTimeOffset totalDeadlineAt)
    {
        if (sketchDeadlineAt > finalDeadlineAt)
        {
            throw new InvalidOperationException("Sketch deadline must be before or equal to final deadline.");
        }

        if (finalDeadlineAt > totalDeadlineAt)
        {
            throw new InvalidOperationException("Final deadline must be before or equal to total deadline.");
        }
    }

    private static void EnsureProjectHasNotPassedTotalDeadline(
        Project project,
        DateTimeOffset now,
        string errorMessage)
    {
        if (project.TotalDeadlineAt <= now)
        {
            throw new ConflictException(errorMessage);
        }
    }

    private static DateTimeOffset Min(DateTimeOffset left, DateTimeOffset right)
    {
        return left <= right ? left : right;
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
        project.IsConfidential = request.IsConfidential ?? false;
        project.AllowStudentPortfolio = request.AllowStudentPortfolio ?? true;
    }

    private static ProjectResponse ToProjectResponse(
        Project project,
        DesignCategory category,
        bool hasApplied = false,
        Guid? myApplicationId = null)
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
            project.CurrentRevisionRound,
            project.IsConfidential,
            project.AllowStudentPortfolio,
            project.PublishedAt,
            project.CreatedAt,
            project.UpdatedAt,
            hasApplied,
            myApplicationId);
    }

    private static DateTimeOffset AddBusinessDays(DateTimeOffset start, int businessDays)
    {
        var result = start;
        var remaining = businessDays;

        while (remaining > 0)
        {
            result = result.AddDays(1);

            if (result.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            {
                continue;
            }

            remaining--;
        }

        return result;
    }

    private static ProjectSubmissionResponse ToSubmissionResponse(
        ProjectSubmission submission,
        IReadOnlyList<SubmissionFile> files)
    {
        return new ProjectSubmissionResponse(
            submission.Id,
            submission.ProjectId,
            submission.SubmittedByStudentId,
            submission.SubmissionType,
            submission.MilestoneType,
            submission.RevisionRound,
            submission.Description,
            submission.Status,
            submission.SubmittedAt,
            submission.ReviewDueAt,
            submission.ApprovedAt,
            submission.AutoApprovedAt,
            files
                .Select(file => new SubmissionFileResponse(
                    file.Id,
                    file.FileId,
                    file.WatermarkedFileId,
                    file.IsOriginalDownloadable))
                .ToList());
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
            offer.PaymentDueAt,
            offer.AcceptedAt,
            offer.RejectedAt,
            offer.ExpiredAt,
            offer.CreatedAt);
    }
}
