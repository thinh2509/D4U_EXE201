namespace D4U.Api.Application.Features.Profiles;

public interface IProfileService
{
    Task<StudentProfileResponse?> GetStudentProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<StudentProfileResponse> UpsertStudentProfileAsync(
        Guid userId,
        UpsertStudentProfileRequest request,
        CancellationToken cancellationToken = default);

    Task<StudentVerificationResponse> SubmitStudentVerificationAsync(
        Guid userId,
        SubmitStudentVerificationRequest request,
        CancellationToken cancellationToken = default);

    Task<SmeProfileResponse?> GetSmeProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<SmeProfileResponse> UpsertSmeProfileAsync(
        Guid userId,
        UpsertSmeProfileRequest request,
        CancellationToken cancellationToken = default);

    Task<StudentVerificationResponse> ApproveStudentVerificationAsync(
        Guid verificationId,
        Guid adminUserId,
        CancellationToken cancellationToken = default);

    Task<StudentVerificationResponse> RejectStudentVerificationAsync(
        Guid verificationId,
        Guid adminUserId,
        RejectStudentVerificationRequest request,
        CancellationToken cancellationToken = default);
}
