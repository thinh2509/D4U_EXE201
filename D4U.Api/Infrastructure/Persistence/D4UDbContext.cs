using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace D4U.Api.Infrastructure.Persistence;

public sealed class D4UDbContext(DbContextOptions<D4UDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<AdminProfile> AdminProfiles => Set<AdminProfile>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    public DbSet<StudentVerification> StudentVerifications => Set<StudentVerification>();
    public DbSet<SmeProfile> SmeProfiles => Set<SmeProfile>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<SmeSubscription> SmeSubscriptions => Set<SmeSubscription>();
    public DbSet<DesignCategory> DesignCategories => Set<DesignCategory>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectAttachment> ProjectAttachments => Set<ProjectAttachment>();
    public DbSet<ProjectApplication> ProjectApplications => Set<ProjectApplication>();
    public DbSet<ProjectOffer> ProjectOffers => Set<ProjectOffer>();
    public DbSet<ProjectStatusHistory> ProjectStatusHistories => Set<ProjectStatusHistory>();
    public DbSet<ProjectMilestone> ProjectMilestones => Set<ProjectMilestone>();
    public DbSet<ProjectSubmission> ProjectSubmissions => Set<ProjectSubmission>();
    public DbSet<SubmissionFile> SubmissionFiles => Set<SubmissionFile>();
    public DbSet<ReviewAction> ReviewActions => Set<ReviewAction>();
    public DbSet<RevisionRequest> RevisionRequests => Set<RevisionRequest>();
    public DbSet<InvalidFileReport> InvalidFileReports => Set<InvalidFileReport>();
    public DbSet<FileAsset> Files => Set<FileAsset>();
    public DbSet<Escrow> Escrows => Set<Escrow>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Refund> Refunds => Set<Refund>();
    public DbSet<Disbursement> Disbursements => Set<Disbursement>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<PaymentMethod> PaymentMethods => Set<PaymentMethod>();
    public DbSet<WithdrawalRequest> WithdrawalRequests => Set<WithdrawalRequest>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<DisputeEvidence> DisputeEvidences => Set<DisputeEvidence>();
    public DbSet<Rating> Ratings => Set<Rating>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("public");

        ConfigureUsers(modelBuilder);
        ConfigureProfiles(modelBuilder);
        ConfigureCatalog(modelBuilder);
        ConfigureProjects(modelBuilder);
        ConfigureExecution(modelBuilder);
        ConfigureFiles(modelBuilder);
        ConfigureMoney(modelBuilder);
        ConfigureOperations(modelBuilder);
        SeedReferenceData(modelBuilder);
    }

    private static void ConfigureUsers(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(user => user.Id);
            entity.HasIndex(user => user.Email).IsUnique();
            entity.HasIndex(user => user.Username).IsUnique();
            entity.HasIndex(user => new { user.Role, user.Status });

            entity.Property(user => user.Id).HasColumnName("id");
            entity.Property(user => user.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
            entity.Property(user => user.Username).HasColumnName("username").HasMaxLength(100).IsRequired();
            entity.Property(user => user.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
            entity.Property(user => user.FullName).HasColumnName("full_name").HasMaxLength(255).IsRequired();
            entity.Property(user => user.AvatarUrl).HasColumnName("avatar_url");
            entity.Property(user => user.Role).HasColumnName("role").HasConversion<string>().HasMaxLength(30).IsRequired();
            entity.Property(user => user.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30).HasDefaultValue(UserStatus.PENDING).IsRequired();
            entity.Property(user => user.EmailVerifiedAt).HasColumnName("email_verified_at");
            entity.Property(user => user.LastLoginAt).HasColumnName("last_login_at");
            entity.Property(user => user.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(user => user.UpdatedAt).HasColumnName("updated_at").IsRequired();
        });

        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.ToTable("user_sessions");
            entity.HasKey(session => session.Id);

            entity.Property(session => session.Id).HasColumnName("id");
            entity.Property(session => session.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(session => session.RefreshTokenHash).HasColumnName("refresh_token_hash").HasMaxLength(255).IsRequired();
            entity.Property(session => session.DeviceInfo).HasColumnName("device_info");
            entity.Property(session => session.IpAddress).HasColumnName("ip_address").HasMaxLength(64);
            entity.Property(session => session.ExpiresAt).HasColumnName("expires_at").IsRequired();
            entity.Property(session => session.RevokedAt).HasColumnName("revoked_at");
            entity.Property(session => session.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<User>().WithMany().HasForeignKey(session => session.UserId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureProfiles(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AdminProfile>(entity =>
        {
            entity.ToTable("admin_profiles");
            entity.HasKey(profile => profile.Id);
            entity.HasIndex(profile => profile.UserId).IsUnique();

            entity.Property(profile => profile.Id).HasColumnName("id");
            entity.Property(profile => profile.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(profile => profile.PermissionLevel).HasColumnName("permission_level").HasMaxLength(50).IsRequired();
            entity.Property(profile => profile.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<User>().WithOne().HasForeignKey<AdminProfile>(profile => profile.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StudentProfile>(entity =>
        {
            entity.ToTable("student_profiles");
            entity.HasKey(profile => profile.Id);
            entity.HasIndex(profile => profile.UserId).IsUnique();
            entity.HasIndex(profile => profile.VerificationStatus);
            entity.HasIndex(profile => profile.AverageRating);

            entity.Property(profile => profile.Id).HasColumnName("id");
            entity.Property(profile => profile.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(profile => profile.School).HasColumnName("school").HasMaxLength(255).IsRequired();
            entity.Property(profile => profile.Major).HasColumnName("major").HasMaxLength(255).IsRequired();
            entity.Property(profile => profile.StudyStartYear).HasColumnName("study_start_year").IsRequired();
            entity.Property(profile => profile.Bio).HasColumnName("bio");
            entity.Property(profile => profile.OnboardingStatus).HasColumnName("onboarding_status").HasMaxLength(50).HasDefaultValue("INCOMPLETE").IsRequired();
            entity.Property(profile => profile.VerificationStatus).HasColumnName("verification_status").HasMaxLength(50).HasDefaultValue("NOT_SUBMITTED").IsRequired();
            entity.Property(profile => profile.AverageRating).HasColumnName("average_rating").HasPrecision(3, 2).HasDefaultValue(0m).IsRequired();
            entity.Property(profile => profile.CompletedProjectsCount).HasColumnName("completed_projects_count").HasDefaultValue(0).IsRequired();
            entity.Property(profile => profile.CanWithdraw).HasColumnName("can_withdraw").HasDefaultValue(false).IsRequired();
            entity.Property(profile => profile.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(profile => profile.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne<User>().WithOne().HasForeignKey<StudentProfile>(profile => profile.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StudentVerification>(entity =>
        {
            entity.ToTable("student_verifications");
            entity.HasKey(verification => verification.Id);
            entity.HasIndex(verification => new { verification.StudentProfileId, verification.Status });

            entity.Property(verification => verification.Id).HasColumnName("id");
            entity.Property(verification => verification.StudentProfileId).HasColumnName("student_profile_id").IsRequired();
            entity.Property(verification => verification.DocumentFileId).HasColumnName("document_file_id").IsRequired();
            entity.Property(verification => verification.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("PENDING").IsRequired();
            entity.Property(verification => verification.ReviewedByAdminId).HasColumnName("reviewed_by_admin_id");
            entity.Property(verification => verification.RejectionReason).HasColumnName("rejection_reason");
            entity.Property(verification => verification.SubmittedAt).HasColumnName("submitted_at").IsRequired();
            entity.Property(verification => verification.ReviewedAt).HasColumnName("reviewed_at");

            entity.HasOne<StudentProfile>().WithMany().HasForeignKey(verification => verification.StudentProfileId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<FileAsset>().WithMany().HasForeignKey(verification => verification.DocumentFileId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(verification => verification.ReviewedByAdminId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SmeProfile>(entity =>
        {
            entity.ToTable("sme_profiles");
            entity.HasKey(profile => profile.Id);
            entity.HasIndex(profile => profile.UserId).IsUnique();

            entity.Property(profile => profile.Id).HasColumnName("id");
            entity.Property(profile => profile.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(profile => profile.CompanyName).HasColumnName("company_name").HasMaxLength(255).IsRequired();
            entity.Property(profile => profile.RepresentativeName).HasColumnName("representative_name").HasMaxLength(255).IsRequired();
            entity.Property(profile => profile.PhoneNumber).HasColumnName("phone_number").HasMaxLength(50).IsRequired();
            entity.Property(profile => profile.BusinessField).HasColumnName("business_field").HasMaxLength(255).IsRequired();
            entity.Property(profile => profile.LogoFileId).HasColumnName("logo_file_id");
            entity.Property(profile => profile.OnboardingStatus).HasColumnName("onboarding_status").HasMaxLength(50).HasDefaultValue("INCOMPLETE").IsRequired();
            entity.Property(profile => profile.AverageRating).HasColumnName("average_rating").HasPrecision(3, 2).HasDefaultValue(0m).IsRequired();
            entity.Property(profile => profile.CompletedProjectsCount).HasColumnName("completed_projects_count").HasDefaultValue(0).IsRequired();
            entity.Property(profile => profile.ActiveOpenProjectCount).HasColumnName("active_open_project_count").HasDefaultValue(0).IsRequired();
            entity.Property(profile => profile.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(profile => profile.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne<User>().WithOne().HasForeignKey<SmeProfile>(profile => profile.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<FileAsset>().WithMany().HasForeignKey(profile => profile.LogoFileId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureCatalog(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SubscriptionPlan>(entity =>
        {
            entity.ToTable("subscription_plans");
            entity.HasKey(plan => plan.Id);
            entity.HasIndex(plan => plan.Code).IsUnique();

            entity.Property(plan => plan.Id).HasColumnName("id");
            entity.Property(plan => plan.Code).HasColumnName("code").HasMaxLength(50).IsRequired();
            entity.Property(plan => plan.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            entity.Property(plan => plan.MonthlyPrice).HasColumnName("monthly_price").HasPrecision(12, 2).IsRequired();
            entity.Property(plan => plan.PlatformFeeRate).HasColumnName("platform_fee_rate").HasPrecision(5, 2).IsRequired();
            entity.Property(plan => plan.MaxActiveOpenProjects).HasColumnName("max_active_open_projects");
            entity.Property(plan => plan.MaxProjectBudget).HasColumnName("max_project_budget").HasPrecision(12, 2);
            entity.Property(plan => plan.IsActive).HasColumnName("is_active").HasDefaultValue(true).IsRequired();
        });

        modelBuilder.Entity<SmeSubscription>(entity =>
        {
            entity.ToTable("sme_subscriptions");
            entity.HasKey(subscription => subscription.Id);
            entity.HasIndex(subscription => new { subscription.SmeProfileId, subscription.Status });

            entity.Property(subscription => subscription.Id).HasColumnName("id");
            entity.Property(subscription => subscription.SmeProfileId).HasColumnName("sme_profile_id").IsRequired();
            entity.Property(subscription => subscription.SubscriptionPlanId).HasColumnName("subscription_plan_id").IsRequired();
            entity.Property(subscription => subscription.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("ACTIVE").IsRequired();
            entity.Property(subscription => subscription.StartedAt).HasColumnName("started_at").IsRequired();
            entity.Property(subscription => subscription.CurrentPeriodEnd).HasColumnName("current_period_end");
            entity.Property(subscription => subscription.CancelledAt).HasColumnName("cancelled_at");
            entity.Property(subscription => subscription.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<SmeProfile>().WithMany().HasForeignKey(subscription => subscription.SmeProfileId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<SubscriptionPlan>().WithMany().HasForeignKey(subscription => subscription.SubscriptionPlanId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DesignCategory>(entity =>
        {
            entity.ToTable("design_categories");
            entity.HasKey(category => category.Id);
            entity.HasIndex(category => category.Name).IsUnique();

            entity.Property(category => category.Id).HasColumnName("id");
            entity.Property(category => category.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            entity.Property(category => category.Description).HasColumnName("description");
            entity.Property(category => category.IsActive).HasColumnName("is_active").HasDefaultValue(true).IsRequired();
        });
    }

    private static void ConfigureProjects(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(entity =>
        {
            entity.ToTable("projects");
            entity.HasKey(project => project.Id);
            entity.HasIndex(project => new { project.Status, project.ProjectType });
            entity.HasIndex(project => new { project.SmeProfileId, project.Status });
            entity.HasIndex(project => new { project.SelectedStudentProfileId, project.Status });
            entity.HasIndex(project => new { project.DesignCategoryId, project.Status });
            entity.HasIndex(project => project.PublishedAt);

            entity.Property(project => project.Id).HasColumnName("id");
            entity.Property(project => project.SmeProfileId).HasColumnName("sme_profile_id").IsRequired();
            entity.Property(project => project.SelectedStudentProfileId).HasColumnName("selected_student_profile_id");
            entity.Property(project => project.DesignCategoryId).HasColumnName("design_category_id").IsRequired();
            entity.Property(project => project.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
            entity.Property(project => project.Brief).HasColumnName("brief").IsRequired();
            entity.Property(project => project.UsagePurpose).HasColumnName("usage_purpose");
            entity.Property(project => project.ProjectType).HasColumnName("project_type").HasConversion<string>().HasMaxLength(30).IsRequired();
            entity.Property(project => project.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40).HasDefaultValue(ProjectStatus.DRAFT).IsRequired();
            entity.Property(project => project.BudgetAmount).HasColumnName("budget_amount").HasPrecision(12, 2).IsRequired();
            entity.Property(project => project.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("VND").IsFixedLength().IsRequired();
            entity.Property(project => project.TotalDeadlineAt).HasColumnName("total_deadline_at").IsRequired();
            entity.Property(project => project.SketchDeadlineAt).HasColumnName("sketch_deadline_at").IsRequired();
            entity.Property(project => project.FinalDeadlineAt).HasColumnName("final_deadline_at").IsRequired();
            entity.Property(project => project.MaxRevisionRounds).HasColumnName("max_revision_rounds").HasDefaultValue(2).IsRequired();
            entity.Property(project => project.CurrentRevisionRound).HasColumnName("current_revision_round").HasDefaultValue(0).IsRequired();
            entity.Property(project => project.IsConfidential).HasColumnName("is_confidential").HasDefaultValue(false).IsRequired();
            entity.Property(project => project.AllowStudentPortfolio).HasColumnName("allow_student_portfolio").HasDefaultValue(true).IsRequired();
            entity.Property(project => project.RatingDueAt).HasColumnName("rating_due_at");
            entity.Property(project => project.PublishedAt).HasColumnName("published_at");
            entity.Property(project => project.AcceptedAt).HasColumnName("accepted_at");
            entity.Property(project => project.CompletedAt).HasColumnName("completed_at");
            entity.Property(project => project.CancelledAt).HasColumnName("cancelled_at");
            entity.Property(project => project.CancellationReason).HasColumnName("cancellation_reason");
            entity.Property(project => project.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(project => project.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne<SmeProfile>().WithMany().HasForeignKey(project => project.SmeProfileId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<StudentProfile>().WithMany().HasForeignKey(project => project.SelectedStudentProfileId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<DesignCategory>().WithMany().HasForeignKey(project => project.DesignCategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProjectAttachment>(entity =>
        {
            entity.ToTable("project_attachments");
            entity.HasKey(attachment => attachment.Id);

            entity.Property(attachment => attachment.Id).HasColumnName("id");
            entity.Property(attachment => attachment.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(attachment => attachment.FileId).HasColumnName("file_id").IsRequired();
            entity.Property(attachment => attachment.AttachmentType).HasColumnName("attachment_type").HasMaxLength(50).HasDefaultValue("BRIEF").IsRequired();
            entity.Property(attachment => attachment.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<Project>().WithMany().HasForeignKey(attachment => attachment.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<FileAsset>().WithMany().HasForeignKey(attachment => attachment.FileId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProjectApplication>(entity =>
        {
            entity.ToTable("project_applications");
            entity.HasKey(application => application.Id);
            entity.HasIndex(application => new { application.ProjectId, application.StudentProfileId }).IsUnique();
            entity.HasIndex(application => new { application.ProjectId, application.Status });
            entity.HasIndex(application => new { application.StudentProfileId, application.Status });

            entity.Property(application => application.Id).HasColumnName("id");
            entity.Property(application => application.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(application => application.StudentProfileId).HasColumnName("student_profile_id").IsRequired();
            entity.Property(application => application.ProposedPrice).HasColumnName("proposed_price").HasPrecision(12, 2).IsRequired();
            entity.Property(application => application.CoverLetter).HasColumnName("cover_letter").IsRequired();
            entity.Property(application => application.EstimatedDurationDays).HasColumnName("estimated_duration_days");
            entity.Property(application => application.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("SUBMITTED").IsRequired();
            entity.Property(application => application.SubmittedAt).HasColumnName("submitted_at").IsRequired();
            entity.Property(application => application.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne<Project>().WithMany().HasForeignKey(application => application.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<StudentProfile>().WithMany().HasForeignKey(application => application.StudentProfileId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProjectOffer>(entity =>
        {
            entity.ToTable("project_offers");
            entity.HasKey(offer => offer.Id);
            entity.HasIndex(offer => new { offer.ProjectId, offer.Status });
            entity.HasIndex(offer => new { offer.StudentProfileId, offer.Status });

            entity.Property(offer => offer.Id).HasColumnName("id");
            entity.Property(offer => offer.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(offer => offer.StudentProfileId).HasColumnName("student_profile_id").IsRequired();
            entity.Property(offer => offer.ApplicationId).HasColumnName("application_id");
            entity.Property(offer => offer.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40).HasDefaultValue(OfferStatus.PENDING_PAYMENT).IsRequired();
            entity.Property(offer => offer.OfferedAmount).HasColumnName("offered_amount").HasPrecision(12, 2).IsRequired();
            entity.Property(offer => offer.ExpiresAt).HasColumnName("expires_at");
            entity.Property(offer => offer.AcceptedAt).HasColumnName("accepted_at");
            entity.Property(offer => offer.RejectedAt).HasColumnName("rejected_at");
            entity.Property(offer => offer.RevokedAt).HasColumnName("revoked_at");
            entity.Property(offer => offer.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<Project>().WithMany().HasForeignKey(offer => offer.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<StudentProfile>().WithMany().HasForeignKey(offer => offer.StudentProfileId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ProjectApplication>().WithMany().HasForeignKey(offer => offer.ApplicationId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProjectStatusHistory>(entity =>
        {
            entity.ToTable("project_status_histories");
            entity.HasKey(history => history.Id);

            entity.Property(history => history.Id).HasColumnName("id");
            entity.Property(history => history.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(history => history.FromStatus).HasColumnName("from_status").HasConversion<string>().HasMaxLength(40);
            entity.Property(history => history.ToStatus).HasColumnName("to_status").HasConversion<string>().HasMaxLength(40).IsRequired();
            entity.Property(history => history.ChangedByUserId).HasColumnName("changed_by_user_id");
            entity.Property(history => history.ChangeReason).HasColumnName("change_reason");
            entity.Property(history => history.MetadataJson).HasColumnName("metadata_json").HasColumnType("jsonb");
            entity.Property(history => history.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<Project>().WithMany().HasForeignKey(history => history.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(history => history.ChangedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureExecution(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectMilestone>(entity =>
        {
            entity.ToTable("project_milestones");
            entity.HasKey(milestone => milestone.Id);
            entity.HasIndex(milestone => new { milestone.ProjectId, milestone.MilestoneType }).IsUnique();
            entity.HasIndex(milestone => new { milestone.Status, milestone.DeadlineAt });
            entity.HasIndex(milestone => new { milestone.Status, milestone.ReviewDueAt });

            entity.Property(milestone => milestone.Id).HasColumnName("id");
            entity.Property(milestone => milestone.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(milestone => milestone.MilestoneType).HasColumnName("milestone_type").HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(milestone => milestone.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40).HasDefaultValue(MilestoneStatus.PENDING).IsRequired();
            entity.Property(milestone => milestone.DeadlineAt).HasColumnName("deadline_at").IsRequired();
            entity.Property(milestone => milestone.SubmittedAt).HasColumnName("submitted_at");
            entity.Property(milestone => milestone.ReviewDueAt).HasColumnName("review_due_at");
            entity.Property(milestone => milestone.ApprovedAt).HasColumnName("approved_at");
            entity.Property(milestone => milestone.AutoApprovedAt).HasColumnName("auto_approved_at");
            entity.Property(milestone => milestone.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(milestone => milestone.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne<Project>().WithMany().HasForeignKey(milestone => milestone.ProjectId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProjectSubmission>(entity =>
        {
            entity.ToTable("project_submissions");
            entity.HasKey(submission => submission.Id);
            entity.HasIndex(submission => new { submission.ProjectId, submission.SubmissionType, submission.RevisionRound });

            entity.Property(submission => submission.Id).HasColumnName("id");
            entity.Property(submission => submission.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(submission => submission.MilestoneId).HasColumnName("milestone_id").IsRequired();
            entity.Property(submission => submission.SubmittedByStudentId).HasColumnName("submitted_by_student_id").IsRequired();
            entity.Property(submission => submission.SubmissionType).HasColumnName("submission_type").HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(submission => submission.RevisionRound).HasColumnName("revision_round").HasDefaultValue(0).IsRequired();
            entity.Property(submission => submission.Description).HasColumnName("description");
            entity.Property(submission => submission.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40).HasDefaultValue(SubmissionStatus.SUBMITTED).IsRequired();
            entity.Property(submission => submission.SubmittedAt).HasColumnName("submitted_at").IsRequired();

            entity.HasOne<Project>().WithMany().HasForeignKey(submission => submission.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ProjectMilestone>().WithMany().HasForeignKey(submission => submission.MilestoneId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<StudentProfile>().WithMany().HasForeignKey(submission => submission.SubmittedByStudentId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SubmissionFile>(entity =>
        {
            entity.ToTable("submission_files");
            entity.HasKey(file => file.Id);

            entity.Property(file => file.Id).HasColumnName("id");
            entity.Property(file => file.SubmissionId).HasColumnName("submission_id").IsRequired();
            entity.Property(file => file.FileId).HasColumnName("file_id").IsRequired();
            entity.Property(file => file.WatermarkedFileId).HasColumnName("watermarked_file_id");
            entity.Property(file => file.IsOriginalDownloadable).HasColumnName("is_original_downloadable").HasDefaultValue(false).IsRequired();
            entity.Property(file => file.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<ProjectSubmission>().WithMany().HasForeignKey(file => file.SubmissionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<FileAsset>().WithMany().HasForeignKey(file => file.FileId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<FileAsset>().WithMany().HasForeignKey(file => file.WatermarkedFileId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ReviewAction>(entity =>
        {
            entity.ToTable("review_actions");
            entity.HasKey(action => action.Id);

            entity.Property(action => action.Id).HasColumnName("id");
            entity.Property(action => action.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(action => action.SubmissionId).HasColumnName("submission_id").IsRequired();
            entity.Property(action => action.ReviewerUserId).HasColumnName("reviewer_user_id");
            entity.Property(action => action.Action).HasColumnName("action").HasConversion<string>().HasMaxLength(40).IsRequired();
            entity.Property(action => action.Comment).HasColumnName("comment");
            entity.Property(action => action.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<Project>().WithMany().HasForeignKey(action => action.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ProjectSubmission>().WithMany().HasForeignKey(action => action.SubmissionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(action => action.ReviewerUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevisionRequest>(entity =>
        {
            entity.ToTable("revision_requests");
            entity.HasKey(request => request.Id);
            entity.HasIndex(request => new { request.ProjectId, request.Status });
            entity.HasIndex(request => new { request.ProjectId, request.RevisionRound, request.SubmissionId }).IsUnique();

            entity.Property(request => request.Id).HasColumnName("id");
            entity.Property(request => request.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(request => request.SubmissionId).HasColumnName("submission_id").IsRequired();
            entity.Property(request => request.RequestedByUserId).HasColumnName("requested_by_user_id").IsRequired();
            entity.Property(request => request.RevisionRound).HasColumnName("revision_round").IsRequired();
            entity.Property(request => request.RequestedChanges).HasColumnName("requested_changes").IsRequired();
            entity.Property(request => request.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("OPEN").IsRequired();
            entity.Property(request => request.DueAt).HasColumnName("due_at").IsRequired();
            entity.Property(request => request.ResolvedAt).HasColumnName("resolved_at");
            entity.Property(request => request.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<Project>().WithMany().HasForeignKey(request => request.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ProjectSubmission>().WithMany().HasForeignKey(request => request.SubmissionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(request => request.RequestedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InvalidFileReport>(entity =>
        {
            entity.ToTable("invalid_file_reports");
            entity.HasKey(report => report.Id);

            entity.Property(report => report.Id).HasColumnName("id");
            entity.Property(report => report.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(report => report.SubmissionId).HasColumnName("submission_id").IsRequired();
            entity.Property(report => report.ReportedByUserId).HasColumnName("reported_by_user_id").IsRequired();
            entity.Property(report => report.ReasonCode).HasColumnName("reason_code").HasConversion<string>().HasMaxLength(40).IsRequired();
            entity.Property(report => report.Description).HasColumnName("description");
            entity.Property(report => report.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("OPEN").IsRequired();
            entity.Property(report => report.ReuploadDueAt).HasColumnName("reupload_due_at").IsRequired();
            entity.Property(report => report.ResolvedAt).HasColumnName("resolved_at");
            entity.Property(report => report.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<Project>().WithMany().HasForeignKey(report => report.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ProjectSubmission>().WithMany().HasForeignKey(report => report.SubmissionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(report => report.ReportedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureFiles(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FileAsset>(entity =>
        {
            entity.ToTable("files");
            entity.HasKey(file => file.Id);
            entity.HasIndex(file => new { file.OwnerUserId, file.CreatedAt });
            entity.HasIndex(file => new { file.StorageProvider, file.StorageKey });

            entity.Property(file => file.Id).HasColumnName("id");
            entity.Property(file => file.OwnerUserId).HasColumnName("owner_user_id");
            entity.Property(file => file.StorageProvider).HasColumnName("storage_provider").HasMaxLength(50).IsRequired();
            entity.Property(file => file.Bucket).HasColumnName("bucket").HasMaxLength(255);
            entity.Property(file => file.StorageKey).HasColumnName("storage_key").IsRequired();
            entity.Property(file => file.OriginalFilename).HasColumnName("original_filename").HasMaxLength(255).IsRequired();
            entity.Property(file => file.MimeType).HasColumnName("mime_type").HasMaxLength(100).IsRequired();
            entity.Property(file => file.FileExtension).HasColumnName("file_extension").HasMaxLength(20).IsRequired();
            entity.Property(file => file.FileSizeBytes).HasColumnName("file_size_bytes").IsRequired();
            entity.Property(file => file.Checksum).HasColumnName("checksum").HasMaxLength(128);
            entity.Property(file => file.Visibility).HasColumnName("visibility").HasMaxLength(50).HasDefaultValue("PRIVATE").IsRequired();
            entity.Property(file => file.ScanStatus).HasColumnName("scan_status").HasMaxLength(50);
            entity.Property(file => file.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(file => file.DeletedAt).HasColumnName("deleted_at");

            entity.HasOne<User>().WithMany().HasForeignKey(file => file.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureMoney(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Escrow>(entity =>
        {
            entity.ToTable("escrows");
            entity.HasKey(escrow => escrow.Id);
            entity.HasIndex(escrow => escrow.ProjectId).IsUnique();
            entity.HasIndex(escrow => escrow.Status);
            entity.HasIndex(escrow => new { escrow.SmeProfileId, escrow.Status });
            entity.HasIndex(escrow => new { escrow.StudentProfileId, escrow.Status });

            entity.Property(escrow => escrow.Id).HasColumnName("id");
            entity.Property(escrow => escrow.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(escrow => escrow.SmeProfileId).HasColumnName("sme_profile_id").IsRequired();
            entity.Property(escrow => escrow.StudentProfileId).HasColumnName("student_profile_id").IsRequired();
            entity.Property(escrow => escrow.Amount).HasColumnName("amount").HasPrecision(12, 2).IsRequired();
            entity.Property(escrow => escrow.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("VND").IsFixedLength().IsRequired();
            entity.Property(escrow => escrow.PlatformFeeRate).HasColumnName("platform_fee_rate").HasPrecision(5, 2).IsRequired();
            entity.Property(escrow => escrow.PlatformFeeAmount).HasColumnName("platform_fee_amount").HasPrecision(12, 2);
            entity.Property(escrow => escrow.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40).HasDefaultValue(EscrowStatus.PENDING_PAYMENT).IsRequired();
            entity.Property(escrow => escrow.FundedAt).HasColumnName("funded_at");
            entity.Property(escrow => escrow.ReleasedAt).HasColumnName("released_at");
            entity.Property(escrow => escrow.RefundedAt).HasColumnName("refunded_at");
            entity.Property(escrow => escrow.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(escrow => escrow.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne<Project>().WithOne().HasForeignKey<Escrow>(escrow => escrow.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<SmeProfile>().WithMany().HasForeignKey(escrow => escrow.SmeProfileId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<StudentProfile>().WithMany().HasForeignKey(escrow => escrow.StudentProfileId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("payments");
            entity.HasKey(payment => payment.Id);
            entity.HasIndex(payment => new { payment.Provider, payment.ProviderTransactionId }).IsUnique();
            entity.HasIndex(payment => new { payment.EscrowId, payment.Status });
            entity.HasIndex(payment => new { payment.PayerUserId, payment.CreatedAt });

            entity.Property(payment => payment.Id).HasColumnName("id");
            entity.Property(payment => payment.PayerUserId).HasColumnName("payer_user_id").IsRequired();
            entity.Property(payment => payment.EscrowId).HasColumnName("escrow_id");
            entity.Property(payment => payment.Amount).HasColumnName("amount").HasPrecision(12, 2).IsRequired();
            entity.Property(payment => payment.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("VND").IsFixedLength().IsRequired();
            entity.Property(payment => payment.Provider).HasColumnName("provider").HasMaxLength(100).IsRequired();
            entity.Property(payment => payment.ProviderTransactionId).HasColumnName("provider_transaction_id").HasMaxLength(255);
            entity.Property(payment => payment.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30).HasDefaultValue(PaymentStatus.PENDING).IsRequired();
            entity.Property(payment => payment.PaidAt).HasColumnName("paid_at");
            entity.Property(payment => payment.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<User>().WithMany().HasForeignKey(payment => payment.PayerUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Escrow>().WithMany().HasForeignKey(payment => payment.EscrowId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Refund>(entity =>
        {
            entity.ToTable("refunds");
            entity.HasKey(refund => refund.Id);

            entity.Property(refund => refund.Id).HasColumnName("id");
            entity.Property(refund => refund.EscrowId).HasColumnName("escrow_id").IsRequired();
            entity.Property(refund => refund.PaymentId).HasColumnName("payment_id");
            entity.Property(refund => refund.Amount).HasColumnName("amount").HasPrecision(12, 2).IsRequired();
            entity.Property(refund => refund.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("VND").IsFixedLength().IsRequired();
            entity.Property(refund => refund.Reason).HasColumnName("reason").HasMaxLength(50).IsRequired();
            entity.Property(refund => refund.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("PENDING").IsRequired();
            entity.Property(refund => refund.ProviderRefundId).HasColumnName("provider_refund_id").HasMaxLength(255);
            entity.Property(refund => refund.CreatedByUserId).HasColumnName("created_by_user_id");
            entity.Property(refund => refund.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(refund => refund.CompletedAt).HasColumnName("completed_at");

            entity.HasOne<Escrow>().WithMany().HasForeignKey(refund => refund.EscrowId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Payment>().WithMany().HasForeignKey(refund => refund.PaymentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(refund => refund.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Disbursement>(entity =>
        {
            entity.ToTable("disbursements");
            entity.HasKey(disbursement => disbursement.Id);

            entity.Property(disbursement => disbursement.Id).HasColumnName("id");
            entity.Property(disbursement => disbursement.EscrowId).HasColumnName("escrow_id").IsRequired();
            entity.Property(disbursement => disbursement.WalletId).HasColumnName("wallet_id").IsRequired();
            entity.Property(disbursement => disbursement.GrossAmount).HasColumnName("gross_amount").HasPrecision(12, 2).IsRequired();
            entity.Property(disbursement => disbursement.PlatformFeeAmount).HasColumnName("platform_fee_amount").HasPrecision(12, 2).IsRequired();
            entity.Property(disbursement => disbursement.NetAmount).HasColumnName("net_amount").HasPrecision(12, 2).IsRequired();
            entity.Property(disbursement => disbursement.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("PENDING").IsRequired();
            entity.Property(disbursement => disbursement.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(disbursement => disbursement.CompletedAt).HasColumnName("completed_at");

            entity.HasOne<Escrow>().WithMany().HasForeignKey(disbursement => disbursement.EscrowId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Wallet>().WithMany().HasForeignKey(disbursement => disbursement.WalletId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.ToTable("wallets");
            entity.HasKey(wallet => wallet.Id);
            entity.HasIndex(wallet => wallet.OwnerUserId).IsUnique();
            entity.HasIndex(wallet => wallet.StudentProfileId).IsUnique();

            entity.Property(wallet => wallet.Id).HasColumnName("id");
            entity.Property(wallet => wallet.OwnerUserId).HasColumnName("owner_user_id").IsRequired();
            entity.Property(wallet => wallet.StudentProfileId).HasColumnName("student_profile_id");
            entity.Property(wallet => wallet.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("VND").IsFixedLength().IsRequired();
            entity.Property(wallet => wallet.AvailableBalance).HasColumnName("available_balance").HasPrecision(12, 2).HasDefaultValue(0m).IsRequired();
            entity.Property(wallet => wallet.PendingBalance).HasColumnName("pending_balance").HasPrecision(12, 2).HasDefaultValue(0m).IsRequired();
            entity.Property(wallet => wallet.LockedBalance).HasColumnName("locked_balance").HasPrecision(12, 2).HasDefaultValue(0m).IsRequired();
            entity.Property(wallet => wallet.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30).HasDefaultValue(WalletStatus.ACTIVE).IsRequired();
            entity.Property(wallet => wallet.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(wallet => wallet.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne<User>().WithOne().HasForeignKey<Wallet>(wallet => wallet.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<StudentProfile>().WithOne().HasForeignKey<Wallet>(wallet => wallet.StudentProfileId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.ToTable("wallet_transactions");
            entity.HasKey(transaction => transaction.Id);
            entity.HasIndex(transaction => new { transaction.WalletId, transaction.CreatedAt });
            entity.HasIndex(transaction => new { transaction.ReferenceType, transaction.ReferenceId });

            entity.Property(transaction => transaction.Id).HasColumnName("id");
            entity.Property(transaction => transaction.WalletId).HasColumnName("wallet_id").IsRequired();
            entity.Property(transaction => transaction.Type).HasColumnName("type").HasConversion<string>().HasMaxLength(40).IsRequired();
            entity.Property(transaction => transaction.Amount).HasColumnName("amount").HasPrecision(12, 2).IsRequired();
            entity.Property(transaction => transaction.BalanceAfter).HasColumnName("balance_after").HasPrecision(12, 2).IsRequired();
            entity.Property(transaction => transaction.ReferenceType).HasColumnName("reference_type").HasMaxLength(50);
            entity.Property(transaction => transaction.ReferenceId).HasColumnName("reference_id");
            entity.Property(transaction => transaction.Description).HasColumnName("description");
            entity.Property(transaction => transaction.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<Wallet>().WithMany().HasForeignKey(transaction => transaction.WalletId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PaymentMethod>(entity =>
        {
            entity.ToTable("payment_methods");
            entity.HasKey(method => method.Id);

            entity.Property(method => method.Id).HasColumnName("id");
            entity.Property(method => method.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(method => method.MethodType).HasColumnName("method_type").HasMaxLength(50).HasDefaultValue("BANK_ACCOUNT").IsRequired();
            entity.Property(method => method.AccountHolderName).HasColumnName("account_holder_name").HasMaxLength(255);
            entity.Property(method => method.MaskedAccountNumber).HasColumnName("masked_account_number").HasMaxLength(100);
            entity.Property(method => method.ProviderToken).HasColumnName("provider_token").HasMaxLength(255);
            entity.Property(method => method.IsDefault).HasColumnName("is_default").HasDefaultValue(false).IsRequired();
            entity.Property(method => method.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("ACTIVE").IsRequired();
            entity.Property(method => method.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<User>().WithMany().HasForeignKey(method => method.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WithdrawalRequest>(entity =>
        {
            entity.ToTable("withdrawal_requests");
            entity.HasKey(request => request.Id);

            entity.Property(request => request.Id).HasColumnName("id");
            entity.Property(request => request.WalletId).HasColumnName("wallet_id").IsRequired();
            entity.Property(request => request.RequestedByUserId).HasColumnName("requested_by_user_id").IsRequired();
            entity.Property(request => request.PaymentMethodId).HasColumnName("payment_method_id").IsRequired();
            entity.Property(request => request.Amount).HasColumnName("amount").HasPrecision(12, 2).IsRequired();
            entity.Property(request => request.FeeAmount).HasColumnName("fee_amount").HasPrecision(12, 2).HasDefaultValue(5000m).IsRequired();
            entity.Property(request => request.NetAmount).HasColumnName("net_amount").HasPrecision(12, 2).IsRequired();
            entity.Property(request => request.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("PENDING").IsRequired();
            entity.Property(request => request.FailureReason).HasColumnName("failure_reason");
            entity.Property(request => request.RequestedAt).HasColumnName("requested_at").IsRequired();
            entity.Property(request => request.ProcessedAt).HasColumnName("processed_at");

            entity.HasOne<Wallet>().WithMany().HasForeignKey(request => request.WalletId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(request => request.RequestedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<PaymentMethod>().WithMany().HasForeignKey(request => request.PaymentMethodId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureOperations(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Dispute>(entity =>
        {
            entity.ToTable("disputes");
            entity.HasKey(dispute => dispute.Id);
            entity.HasIndex(dispute => new { dispute.ProjectId, dispute.Status });
            entity.HasIndex(dispute => new { dispute.AssignedAdminId, dispute.Status });

            entity.Property(dispute => dispute.Id).HasColumnName("id");
            entity.Property(dispute => dispute.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(dispute => dispute.EscrowId).HasColumnName("escrow_id");
            entity.Property(dispute => dispute.OpenedByUserId).HasColumnName("opened_by_user_id").IsRequired();
            entity.Property(dispute => dispute.AgainstUserId).HasColumnName("against_user_id");
            entity.Property(dispute => dispute.ReasonCode).HasColumnName("reason_code").HasMaxLength(50).IsRequired();
            entity.Property(dispute => dispute.Description).HasColumnName("description").IsRequired();
            entity.Property(dispute => dispute.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30).HasDefaultValue(DisputeStatus.OPEN).IsRequired();
            entity.Property(dispute => dispute.AssignedAdminId).HasColumnName("assigned_admin_id");
            entity.Property(dispute => dispute.DecisionType).HasColumnName("decision_type").HasMaxLength(50);
            entity.Property(dispute => dispute.SmeRefundAmount).HasColumnName("sme_refund_amount").HasPrecision(12, 2).HasDefaultValue(0m).IsRequired();
            entity.Property(dispute => dispute.StudentPayoutAmount).HasColumnName("student_payout_amount").HasPrecision(12, 2).HasDefaultValue(0m).IsRequired();
            entity.Property(dispute => dispute.PlatformFeeAmount).HasColumnName("platform_fee_amount").HasPrecision(12, 2).HasDefaultValue(0m).IsRequired();
            entity.Property(dispute => dispute.DecisionRationale).HasColumnName("decision_rationale");
            entity.Property(dispute => dispute.OpenedAt).HasColumnName("opened_at").IsRequired();
            entity.Property(dispute => dispute.ResolvedAt).HasColumnName("resolved_at");

            entity.HasOne<Project>().WithMany().HasForeignKey(dispute => dispute.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Escrow>().WithMany().HasForeignKey(dispute => dispute.EscrowId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(dispute => dispute.OpenedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(dispute => dispute.AgainstUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(dispute => dispute.AssignedAdminId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DisputeEvidence>(entity =>
        {
            entity.ToTable("dispute_evidences");
            entity.HasKey(evidence => evidence.Id);

            entity.Property(evidence => evidence.Id).HasColumnName("id");
            entity.Property(evidence => evidence.DisputeId).HasColumnName("dispute_id").IsRequired();
            entity.Property(evidence => evidence.SubmittedByUserId).HasColumnName("submitted_by_user_id").IsRequired();
            entity.Property(evidence => evidence.FileId).HasColumnName("file_id");
            entity.Property(evidence => evidence.Comment).HasColumnName("comment");
            entity.Property(evidence => evidence.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<Dispute>().WithMany().HasForeignKey(evidence => evidence.DisputeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(evidence => evidence.SubmittedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<FileAsset>().WithMany().HasForeignKey(evidence => evidence.FileId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Rating>(entity =>
        {
            entity.ToTable("ratings");
            entity.HasKey(rating => rating.Id);
            entity.HasIndex(rating => new { rating.ProjectId, rating.RaterUserId, rating.RatedUserId }).IsUnique();
            entity.HasIndex(rating => new { rating.RatedUserId, rating.CreatedAt });

            entity.Property(rating => rating.Id).HasColumnName("id");
            entity.Property(rating => rating.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(rating => rating.RaterUserId).HasColumnName("rater_user_id").IsRequired();
            entity.Property(rating => rating.RatedUserId).HasColumnName("rated_user_id").IsRequired();
            entity.Property(rating => rating.RatingValue).HasColumnName("rating_value").IsRequired();
            entity.Property(rating => rating.Comment).HasColumnName("comment").HasMaxLength(500);
            entity.Property(rating => rating.IsPublic).HasColumnName("is_public").HasDefaultValue(false).IsRequired();
            entity.Property(rating => rating.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.ToTable(table => table.HasCheckConstraint("ck_ratings_rating_value", "rating_value between 1 and 5"));

            entity.HasOne<Project>().WithMany().HasForeignKey(rating => rating.ProjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(rating => rating.RaterUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(rating => rating.RatedUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications");
            entity.HasKey(notification => notification.Id);
            entity.HasIndex(notification => new { notification.RecipientUserId, notification.Status, notification.CreatedAt });

            entity.Property(notification => notification.Id).HasColumnName("id");
            entity.Property(notification => notification.RecipientUserId).HasColumnName("recipient_user_id").IsRequired();
            entity.Property(notification => notification.ActorUserId).HasColumnName("actor_user_id");
            entity.Property(notification => notification.Type).HasColumnName("type").HasMaxLength(80).IsRequired();
            entity.Property(notification => notification.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
            entity.Property(notification => notification.Body).HasColumnName("body");
            entity.Property(notification => notification.ReferenceType).HasColumnName("reference_type").HasMaxLength(50);
            entity.Property(notification => notification.ReferenceId).HasColumnName("reference_id");
            entity.Property(notification => notification.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20).HasDefaultValue(NotificationStatus.UNREAD).IsRequired();
            entity.Property(notification => notification.ReadAt).HasColumnName("read_at");
            entity.Property(notification => notification.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<User>().WithMany().HasForeignKey(notification => notification.RecipientUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<User>().WithMany().HasForeignKey(notification => notification.ActorUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("audit_logs");
            entity.HasKey(log => log.Id);
            entity.HasIndex(log => new { log.ActorUserId, log.CreatedAt });
            entity.HasIndex(log => new { log.EntityType, log.EntityId });
            entity.HasIndex(log => new { log.Action, log.CreatedAt });

            entity.Property(log => log.Id).HasColumnName("id");
            entity.Property(log => log.ActorUserId).HasColumnName("actor_user_id");
            entity.Property(log => log.Action).HasColumnName("action").HasMaxLength(100).IsRequired();
            entity.Property(log => log.EntityType).HasColumnName("entity_type").HasMaxLength(100).IsRequired();
            entity.Property(log => log.EntityId).HasColumnName("entity_id");
            entity.Property(log => log.BeforeJson).HasColumnName("before_json").HasColumnType("jsonb");
            entity.Property(log => log.AfterJson).HasColumnName("after_json").HasColumnType("jsonb");
            entity.Property(log => log.IpAddress).HasColumnName("ip_address").HasMaxLength(64);
            entity.Property(log => log.UserAgent).HasColumnName("user_agent");
            entity.Property(log => log.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne<User>().WithMany().HasForeignKey(log => log.ActorUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void SeedReferenceData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SubscriptionPlan>().HasData(
            new SubscriptionPlan
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Code = "BASIC",
                Name = "Basic",
                MonthlyPrice = 0m,
                PlatformFeeRate = 0.10m,
                MaxActiveOpenProjects = 2,
                MaxProjectBudget = 5_000_000m,
                IsActive = true
            },
            new SubscriptionPlan
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Code = "PRO",
                Name = "Pro",
                MonthlyPrice = 199_000m,
                PlatformFeeRate = 0.07m,
                MaxActiveOpenProjects = 10,
                MaxProjectBudget = 20_000_000m,
                IsActive = true
            },
            new SubscriptionPlan
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Code = "PREMIUM",
                Name = "Premium",
                MonthlyPrice = 499_000m,
                PlatformFeeRate = 0.05m,
                MaxActiveOpenProjects = null,
                MaxProjectBudget = null,
                IsActive = true
            });

        modelBuilder.Entity<DesignCategory>().HasData(
            new DesignCategory
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001"),
                Name = "Logo & Brand Identity",
                Description = "Logo, brand marks, and basic identity systems.",
                IsActive = true
            },
            new DesignCategory
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000002"),
                Name = "Social Media Design",
                Description = "Posts, banners, ads, and social campaign visuals.",
                IsActive = true
            },
            new DesignCategory
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000003"),
                Name = "Packaging Design",
                Description = "Product packaging, labels, and retail presentation.",
                IsActive = true
            },
            new DesignCategory
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000004"),
                Name = "UI/UX Design",
                Description = "Website, app, landing page, and interface mockups.",
                IsActive = true
            },
            new DesignCategory
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000005"),
                Name = "Print Design",
                Description = "Flyers, posters, brochures, menus, and print collateral.",
                IsActive = true
            },
            new DesignCategory
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000006"),
                Name = "Illustration",
                Description = "Custom illustration, icons, mascots, and visual assets.",
                IsActive = true
            });
    }
}
