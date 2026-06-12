using D4U.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace D4U.Api.Infrastructure.Persistence;

public sealed class D4UDbContext(DbContextOptions<D4UDbContext> options) : DbContext(options)
{

    public DbSet<User> Users => Set<User>();
    public DbSet<UserExternalLogin> UserExternalLogins => Set<UserExternalLogin>();
    public DbSet<UserEmailVerification> UserEmailVerifications => Set<UserEmailVerification>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<AdminProfile> AdminProfiles => Set<AdminProfile>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    public DbSet<StudentSkill> StudentSkills => Set<StudentSkill>();
    public DbSet<StudentPortfolioItem> StudentPortfolioItems => Set<StudentPortfolioItem>();
    public DbSet<StudentPortfolioItemSkill> StudentPortfolioItemSkills => Set<StudentPortfolioItemSkill>();
    public DbSet<StudentVerification> StudentVerifications => Set<StudentVerification>();
    public DbSet<StudentEmailVerification> StudentEmailVerifications => Set<StudentEmailVerification>();
    public DbSet<SmeProfile> SmeProfiles => Set<SmeProfile>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<DesignCategory> DesignCategories => Set<DesignCategory>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectAttachment> ProjectAttachments => Set<ProjectAttachment>();
    public DbSet<ProjectApplication> ProjectApplications => Set<ProjectApplication>();
    public DbSet<ProjectOffer> ProjectOffers => Set<ProjectOffer>();
    public DbSet<ProjectSubmission> ProjectSubmissions => Set<ProjectSubmission>();
    public DbSet<SubmissionFile> SubmissionFiles => Set<SubmissionFile>();
    public DbSet<ReviewAction> ReviewActions => Set<ReviewAction>();
    public DbSet<FileAsset> Files => Set<FileAsset>();
    public DbSet<Escrow> Escrows => Set<Escrow>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Refund> Refunds => Set<Refund>();
    public DbSet<Disbursement> Disbursements => Set<Disbursement>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<PaymentMethod> PaymentMethods => Set<PaymentMethod>();
    public DbSet<WithdrawalRequest> WithdrawalRequests => Set<WithdrawalRequest>();
    public DbSet<FeaturePackage> FeaturePackages => Set<FeaturePackage>();
    public DbSet<FeaturePackagePurchase> FeaturePackagePurchases => Set<FeaturePackagePurchase>();
    public DbSet<UserFeatureEntitlement> UserFeatureEntitlements => Set<UserFeatureEntitlement>();
    public DbSet<Rating> Ratings => Set<Rating>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("public");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(D4UDbContext).Assembly);
    }
}
