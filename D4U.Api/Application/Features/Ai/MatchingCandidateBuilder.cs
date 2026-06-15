namespace D4U.Api.Application.Features.Ai;

using D4U.Api.Application.Common.Data;
using D4U.Api.Application.Features.Students;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

internal sealed class MatchingCandidateBuilder(
    IUnitOfWork unitOfWork,
    IStudentCapabilityService studentCapabilityService) : IMatchingCandidateBuilder
{
    private const int DiscoverPoolLimit = 80;

    public async Task<IReadOnlyList<MatchingCandidateInput>> BuildCandidatesAsync(
        Project project,
        CancellationToken cancellationToken = default)
    {
        var applications = await unitOfWork.Repository<ProjectApplication>().Query()
            .Where(value => value.ProjectId == project.Id)
            .ToListAsync(cancellationToken);

        var applicantIds = applications
            .Select(value => value.StudentProfileId)
            .Distinct()
            .ToList();

        var discoverProfiles = await (
            from profile in unitOfWork.Repository<StudentProfile>().Query()
            join user in unitOfWork.Repository<User>().Query() on profile.UserId equals user.Id
            where user.Role == UserRole.STUDENT &&
                  user.Status == UserStatus.ACTIVE &&
                  string.Equals(profile.VerificationStatus, "APPROVED", StringComparison.OrdinalIgnoreCase)
            orderby profile.CompletedProjectsCount descending, profile.AverageRating descending, profile.UpdatedAt descending
            select new
            {
                Profile = profile,
                User = user
            })
            .Take(DiscoverPoolLimit)
            .ToListAsync(cancellationToken);

        var discoverIds = discoverProfiles.Select(value => value.Profile.Id);
        var candidateIds = applicantIds
            .Concat(discoverIds)
            .Distinct()
            .ToList();

        if (candidateIds.Count == 0)
        {
            return [];
        }

        var missingProfileIds = candidateIds.Except(discoverProfiles.Select(value => value.Profile.Id)).ToList();
        var applicantProfiles = missingProfileIds.Count == 0
            ? []
            : await (
                from profile in unitOfWork.Repository<StudentProfile>().Query()
                join user in unitOfWork.Repository<User>().Query() on profile.UserId equals user.Id
                where missingProfileIds.Contains(profile.Id) &&
                      user.Role == UserRole.STUDENT &&
                      user.Status == UserStatus.ACTIVE &&
                      string.Equals(profile.VerificationStatus, "APPROVED", StringComparison.OrdinalIgnoreCase)
                select new
                {
                    Profile = profile,
                    User = user
                })
                .ToListAsync(cancellationToken);

        var allProfiles = discoverProfiles
            .Concat(applicantProfiles)
            .GroupBy(value => value.Profile.Id)
            .Select(group => group.First())
            .ToList();

        if (allProfiles.Count == 0)
        {
            return [];
        }

        var capabilitySummaries = await studentCapabilityService.GetStudentCapabilitySummariesAsync(
            allProfiles.Select(value => value.Profile.Id).ToList(),
            project.DesignCategoryId,
            cancellationToken);

        var applicationsByStudent = applications
            .GroupBy(value => value.StudentProfileId)
            .ToDictionary(group => group.Key, group => group.OrderByDescending(value => value.SubmittedAt).First());

        return allProfiles
            .Where(value => capabilitySummaries.ContainsKey(value.Profile.Id))
            .Select(value =>
            {
                applicationsByStudent.TryGetValue(value.Profile.Id, out var application);

                return new MatchingCandidateInput(
                    value.Profile.Id,
                    value.User.Id,
                    value.User.FullName,
                    value.Profile.School,
                    value.Profile.Major,
                    value.Profile.Bio,
                    value.Profile.VerificationStatus,
                    value.Profile.AverageRating,
                    value.Profile.CompletedProjectsCount,
                    application is not null,
                    application?.ProposedPrice,
                    capabilitySummaries[value.Profile.Id]);
            })
            .ToList();
    }
}
