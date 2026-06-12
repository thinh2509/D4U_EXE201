namespace D4U.Api.Domain.Enums;

public enum UserRole
{
    STUDENT,
    SME,
    ADMIN
}

public enum UserStatus
{
    PENDING,
    ACTIVE,
    SUSPENDED,
    BANNED,
    DELETED
}

public enum ProjectType
{
    OPEN,
    PRIVATE
}

public enum ProjectStatus
{
    DRAFT,
    OPEN,
    PRIVATE_INVITED,
    OFFER_SELECTED,
    IN_PROGRESS,
    SKETCH_REVIEW,
    REVISION_REQUESTED,
    FINAL_REVIEW,
    ADMIN_REVIEW,
    COMPLETED,
    STUDENT_ABANDONED,
    CANCELLED
}

public enum OfferStatus
{
    WAITING_ACCEPTANCE,
    ACCEPTED,
    REJECTED,
    EXPIRED,
    PENDING_PAYMENT,
    PAYMENT_FAILED,
    ACTIVE
}

public enum PaymentStatus
{
    PENDING,
    SUCCESS,
    FAILED,
    CANCELLED,
    EXPIRED
}

public enum PaymentTargetType
{
    ESCROW,
    FEATURE_PACKAGE_PURCHASE
}

public enum EscrowStatus
{
    PENDING_PAYMENT,
    FUNDED,
    RELEASE_PENDING,
    RELEASED,
    REFUND_PENDING,
    REFUNDED,
    PARTIALLY_REFUNDED,
    CANCELLED
}

public enum SubmissionStage
{
    SKETCH,
    FINAL
}

public enum SubmissionType
{
    SKETCH,
    FINAL,
    REVISION
}

public enum SubmissionStatus
{
    SUBMITTED,
    VALID,
    INVALID_REPORTED,
    APPROVED,
    REVISION_REQUESTED
}

public enum ReviewActionType
{
    APPROVE_SKETCH,
    APPROVE_FINAL,
    REQUEST_REVISION,
    REPORT_INVALID_FILE,
    AUTO_APPROVE,
    ADMIN_FORCE_COMPLETE,
    ADMIN_CANCEL
}

public enum InvalidFileReason
{
    EMPTY_FILE,
    CANNOT_OPEN,
    WRONG_FORMAT,
    UNRELATED,
    BROKEN_LINK,
    OTHER
}

public enum WalletStatus
{
    ACTIVE,
    LOCKED,
    CLOSED
}

public enum WalletTransactionType
{
    DISBURSEMENT_CREDIT,
    WITHDRAWAL_DEBIT,
    WITHDRAWAL_FAILED_REVERSAL,
    ADMIN_ADJUSTMENT
}

public enum NotificationStatus
{
    UNREAD,
    READ
}

public enum StudentSkillLevel
{
    BEGINNER,
    INTERMEDIATE,
    ADVANCED
}

public enum PortfolioItemStatus
{
    DRAFT,
    PUBLIC,
    PRIVATE,
    HIDDEN
}

public enum FeaturePackageRole
{
    STUDENT,
    SME
}

public enum FeaturePackagePurchaseStatus
{
    PENDING,
    ACTIVE,
    FAILED,
    CANCELLED,
    EXPIRED
}

public enum FeatureEntitlementStatus
{
    ACTIVE,
    CANCELLED,
    EXPIRED
}
