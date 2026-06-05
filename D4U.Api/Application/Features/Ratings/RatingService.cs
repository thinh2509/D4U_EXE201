namespace D4U.Api.Application.Features.Ratings;

using D4U.Api.Application.Common.Exceptions;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class RatingService(D4UDbContext dbContext) : IRatingService
{
    public async Task<RatingResponse> SubmitProjectRatingAsync(
        Guid userId,
        Guid projectId,
        SubmitRatingRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.RatingValue is < 1 or > 5)
        {
            throw new ValidationException("Rating value must be between 1 and 5.");
        }

        var project = await dbContext.Projects.FirstOrDefaultAsync(value => value.Id == projectId, cancellationToken)
            ?? throw new NotFoundException("Project was not found.");

        if (project.Status != ProjectStatus.COMPLETED || !project.CompletedAt.HasValue)
        {
            throw new ConflictException("Project must be completed before rating.");
        }

        if (DateTimeOffset.UtcNow > project.CompletedAt.Value.AddDays(7))
        {
            throw new GoneException("Project rating window has expired.");
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(value => value.Id == userId, cancellationToken)
            ?? throw new ForbiddenException("User was not found.");
        var ratedUserId = await ResolveRatedUserIdAsync(user, project, cancellationToken);
        var duplicate = await dbContext.Ratings.AnyAsync(
            value => value.ProjectId == projectId &&
                value.RaterUserId == userId &&
                value.RatedUserId == ratedUserId,
            cancellationToken);

        if (duplicate)
        {
            throw new ConflictException("You have already rated this project participant.");
        }

        var rating = new Rating
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            RaterUserId = userId,
            RatedUserId = ratedUserId,
            RatingValue = request.RatingValue,
            Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
            IsPublic = request.IsPublic,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await dbContext.Ratings.AddAsync(rating, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        await RecalculateAverageRatingAsync(ratedUserId, cancellationToken);
        return ToResponse(rating);
    }

    public async Task<IReadOnlyList<RatingResponse>> ListMyRatingsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Ratings
            .Where(value => value.RaterUserId == userId || value.RatedUserId == userId)
            .OrderByDescending(value => value.CreatedAt)
            .Select(value => ToResponse(value))
            .ToListAsync(cancellationToken);
    }

    private async Task<Guid> ResolveRatedUserIdAsync(
        User user,
        Project project,
        CancellationToken cancellationToken)
    {
        if (user.Role == UserRole.SME)
        {
            var smeProfile = await dbContext.SmeProfiles.FirstOrDefaultAsync(
                value => value.UserId == user.Id,
                cancellationToken) ?? throw new ForbiddenException("SME profile was not found.");

            if (smeProfile.Id != project.SmeProfileId)
            {
                throw new ForbiddenException("Only the owner SME can rate the selected student.");
            }

            if (!project.SelectedStudentProfileId.HasValue)
            {
                throw new ConflictException("Project has no selected student.");
            }

            var studentProfile = await dbContext.StudentProfiles.FirstOrDefaultAsync(
                value => value.Id == project.SelectedStudentProfileId.Value,
                cancellationToken) ?? throw new NotFoundException("Student profile was not found.");
            return studentProfile.UserId;
        }

        if (user.Role == UserRole.STUDENT)
        {
            var studentProfile = await dbContext.StudentProfiles.FirstOrDefaultAsync(
                value => value.UserId == user.Id,
                cancellationToken) ?? throw new ForbiddenException("Student profile was not found.");

            if (project.SelectedStudentProfileId != studentProfile.Id)
            {
                throw new ForbiddenException("Only the selected student can rate the SME.");
            }

            var smeProfile = await dbContext.SmeProfiles.FirstOrDefaultAsync(
                value => value.Id == project.SmeProfileId,
                cancellationToken) ?? throw new NotFoundException("SME profile was not found.");
            return smeProfile.UserId;
        }

        throw new ForbiddenException("Admin users cannot rate projects.");
    }

    private async Task RecalculateAverageRatingAsync(Guid ratedUserId, CancellationToken cancellationToken)
    {
        var average = await dbContext.Ratings
            .Where(value => value.RatedUserId == ratedUserId && value.IsPublic)
            .AverageAsync(value => (decimal?)value.RatingValue, cancellationToken) ?? 0m;
        average = decimal.Round(average, 2);

        var studentProfile = await dbContext.StudentProfiles.FirstOrDefaultAsync(
            value => value.UserId == ratedUserId,
            cancellationToken);

        if (studentProfile is not null)
        {
            studentProfile.AverageRating = average;
            studentProfile.UpdatedAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        var smeProfile = await dbContext.SmeProfiles.FirstOrDefaultAsync(
            value => value.UserId == ratedUserId,
            cancellationToken);

        if (smeProfile is not null)
        {
            smeProfile.AverageRating = average;
            smeProfile.UpdatedAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private static RatingResponse ToResponse(Rating rating)
    {
        return new RatingResponse(
            rating.Id,
            rating.ProjectId,
            rating.RaterUserId,
            rating.RatedUserId,
            rating.RatingValue,
            rating.Comment,
            rating.IsPublic,
            rating.CreatedAt);
    }
}
