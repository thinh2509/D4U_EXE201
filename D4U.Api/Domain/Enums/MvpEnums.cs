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
    PAYMENT_SECURED,
    WAITING_FOR_ACCEPTANCE,
    IN_PROGRESS,
    SKETCH_SUBMITTED,
    SKETCH_IN_REVIEW,
    REVISION_REQUESTED,
    FINAL_SUBMITTED,
    FINAL_IN_REVIEW,
    COMPLETED,
    FUNDS_AVAILABLE,
    CANCELLED,
    DISPUTED
}

public enum OfferStatus
{
    PENDING_PAYMENT,
    WAITING_ACCEPTANCE,
    ACCEPTED,
    REJECTED,
    REVOKED,
    EXPIRED
}

public enum PaymentStatus
{
    PENDING,
    SUCCESS,
    FAILED,
    CANCELLED,
    EXPIRED
}

public enum EscrowStatus
{
    PENDING_PAYMENT,
    FUNDED,
    RELEASE_PENDING,
    RELEASED,
    REFUNDED,
    PARTIALLY_REFUNDED,
    DISPUTED,
    CANCELLED
}

public enum MilestoneType
{
    SKETCH,
    FINAL
}

public enum MilestoneStatus
{
    PENDING,
    SUBMITTED,
    IN_REVIEW,
    APPROVED,
    REVISION_REQUESTED,
    AUTO_APPROVED,
    CANCELLED
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
    REVISION_REQUESTED,
    DISPUTED
}

public enum ReviewActionType
{
    APPROVE_SKETCH,
    APPROVE_FINAL,
    REQUEST_REVISION,
    REPORT_INVALID_FILE,
    OPEN_DISPUTE,
    AUTO_APPROVE
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

public enum DisputeStatus
{
    OPEN,
    UNDER_REVIEW,
    RESOLVED,
    REJECTED,
    CANCELLED
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
