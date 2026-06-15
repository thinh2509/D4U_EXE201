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

        var trimmedComment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim();
        if (trimmedComment?.Length > 500)
        {
            throw new ValidationException("Rating comment must not exceed 500 characters.");
        }

        var project = await dbContext.Projects.FirstOrDefaultAsync(value => value.Id == projectId, cancellationToken)
            ?? throw new NotFoundException("Project was not found.");

        if (project.Status != ProjectStatus.COMPLETED || !project.CompletedAt.HasValue)
        {
            throw new ConflictException("Project must be completed before rating.");
        }

        if (!project.RatingDueAt.HasValue)
        {
            throw new ConflictException("Project rating window is not available.");
        }

        if (DateTimeOffset.UtcNow > project.RatingDueAt.Value)
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
            Comment = trimmedComment,
            IsPublic = request.IsPublic,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await dbContext.Ratings.AddAsync(rating, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        await RecalculateAverageRatingAsync(ratedUserId, cancellationToken);
        return await ToResponseAsync(rating, cancellationToken);
    }

    public async Task<IReadOnlyList<RatingResponse>> ListMyRatingsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await (
            from rating in dbContext.Ratings
            join project in dbContext.Projects on rating.ProjectId equals project.Id
            join rater in dbContext.Users on rating.RaterUserId equals rater.Id
            join rated in dbContext.Users on rating.RatedUserId equals rated.Id
            where rating.RaterUserId == userId || rating.RatedUserId == userId
            orderby rating.CreatedAt descending
            select new RatingResponse(
                rating.Id,
                rating.ProjectId,
                project.Title,
                rating.RaterUserId,
                rater.FullName,
                rating.RatedUserId,
                rated.FullName,
                rating.RatingValue,
                rating.Comment,
                rating.IsPublic,
                rating.CreatedAt))
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

    private async Task<RatingResponse> ToResponseAsync(Rating rating, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects.FirstAsync(value => value.Id == rating.ProjectId, cancellationToken);
        var rater = await dbContext.Users.FirstAsync(value => value.Id == rating.RaterUserId, cancellationToken);
        var rated = await dbContext.Users.FirstAsync(value => value.Id == rating.RatedUserId, cancellationToken);

        return new RatingResponse(
            rating.Id,
            rating.ProjectId,
            project.Title,
            rating.RaterUserId,
            rater.FullName,
            rating.RatedUserId,
            rated.FullName,
            rating.RatingValue,
            rating.Comment,
            rating.IsPublic,
            rating.CreatedAt);
    }
}
