namespace D4U.Api.Application.Features.Students;

using System.Text;
using System.Text.RegularExpressions;
using D4U.Api.Application.Common.Data;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

public sealed partial class StudentCapabilityService(IUnitOfWork unitOfWork) : IStudentCapabilityService
{
    public async Task<IReadOnlyList<StudentSkillResponse>> ListMySkillsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var profile = await RequireActiveStudentOwnerProfileAsync(userId, cancellationToken);
        return await ListSkillsByProfileIdAsync(profile.Id, cancellationToken);
    }

    public async Task<StudentSkillResponse> CreateSkillAsync(
        Guid userId,
        UpsertStudentSkillRequest request,
        CancellationToken cancellationToken = default)
    {
        var profile = await RequireActiveStudentOwnerProfileAsync(userId, cancellationToken);
        var normalizedSkillName = NormalizeSkillName(request.SkillName);

        var alreadyExists = await unitOfWork.Repository<StudentSkill>().AnyAsync(
            skill => skill.StudentProfileId == profile.Id && skill.NormalizedSkillName == normalizedSkillName,
            cancellationToken);

        if (alreadyExists)
        {
            throw new InvalidOperationException("Student already has a skill with the same name.");
        }

        var now = DateTimeOffset.UtcNow;
        var skill = new StudentSkill
        {
            Id = Guid.NewGuid(),
            StudentProfileId = profile.Id,
            SkillName = request.SkillName.Trim(),
            NormalizedSkillName = normalizedSkillName,
            Level = request.Level,
            YearsOfExperience = request.YearsOfExperience,
            ExperienceNote = NormalizeOptionalText(request.ExperienceNote),
            IsHighlighted = request.IsHighlighted,
            CreatedAt = now,
            UpdatedAt = now
        };

        await unitOfWork.Repository<StudentSkill>().AddAsync(skill, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToStudentSkillResponse(skill);
    }

    public async Task<StudentSkillResponse> UpdateSkillAsync(
        Guid userId,
        Guid skillId,
        UpsertStudentSkillRequest request,
        CancellationToken cancellationToken = default)
    {
        var profile = await RequireActiveStudentOwnerProfileAsync(userId, cancellationToken);
        var skill = await RequireOwnedSkillAsync(profile.Id, skillId, cancellationToken);
        var normalizedSkillName = NormalizeSkillName(request.SkillName);

        var duplicateExists = await unitOfWork.Repository<StudentSkill>().AnyAsync(
            value => value.StudentProfileId == profile.Id &&
                     value.NormalizedSkillName == normalizedSkillName &&
                     value.Id != skill.Id,
            cancellationToken);

        if (duplicateExists)
        {
            throw new InvalidOperationException("Student already has a skill with the same name.");
        }

        skill.SkillName = request.SkillName.Trim();
        skill.NormalizedSkillName = normalizedSkillName;
        skill.Level = request.Level;
        skill.YearsOfExperience = request.YearsOfExperience;
        skill.ExperienceNote = NormalizeOptionalText(request.ExperienceNote);
        skill.IsHighlighted = request.IsHighlighted;
        skill.UpdatedAt = DateTimeOffset.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ToStudentSkillResponse(skill);
    }

    public async Task DeleteSkillAsync(
        Guid userId,
        Guid skillId,
        CancellationToken cancellationToken = default)
    {
        var profile = await RequireActiveStudentOwnerProfileAsync(userId, cancellationToken);
        var skill = await RequireOwnedSkillAsync(profile.Id, skillId, cancellationToken);

        unitOfWork.Repository<StudentSkill>().Remove(skill);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StudentPortfolioItemResponse>> ListMyPortfolioAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var profile = await RequireActiveStudentOwnerProfileAsync(userId, cancellationToken);
        return await BuildPortfolioResponsesAsync(
            profile.Id,
            null,
            cancellationToken);
    }

    public async Task<StudentPortfolioItemResponse> CreatePortfolioItemAsync(
        Guid userId,
        UpsertStudentPortfolioItemRequest request,
        CancellationToken cancellationToken = default)
    {
        var profile = await RequireActiveStudentOwnerProfileAsync(userId, cancellationToken);
        await ValidatePortfolioRequestAsync(profile.Id, request, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var item = new StudentPortfolioItem
        {
            Id = Guid.NewGuid(),
            StudentProfileId = profile.Id,
            SourceProjectId = request.SourceProjectId,
            DesignCategoryId = request.DesignCategoryId,
            Title = request.Title.Trim(),
            Description = (request.Description ?? string.Empty).Trim(),
            ThumbnailUrl = NormalizeOptionalText(request.ThumbnailUrl),
            ProjectUrl = NormalizeOptionalText(request.ProjectUrl?.Trim()),
            FileUrl = NormalizeOptionalText(request.FileUrl),
            CompletedAt = request.CompletedAt,
            Status = PortfolioItemStatus.PRIVATE,
            IsFeatured = request.IsFeatured,
            CreatedAt = now,
            UpdatedAt = now
        };

        await unitOfWork.Repository<StudentPortfolioItem>().AddAsync(item, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await ReplacePortfolioSkillLinksAsync(item.Id, profile.Id, request.StudentSkillIds, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await BuildPortfolioItemResponseAsync(item.Id, cancellationToken);
    }

    public async Task<StudentPortfolioItemResponse> UpdatePortfolioItemAsync(
        Guid userId,
        Guid portfolioItemId,
        UpsertStudentPortfolioItemRequest request,
        CancellationToken cancellationToken = default)
    {
        var profile = await RequireActiveStudentOwnerProfileAsync(userId, cancellationToken);
        var item = await RequireOwnedPortfolioItemAsync(profile.Id, portfolioItemId, cancellationToken);
        await ValidatePortfolioRequestAsync(profile.Id, request, cancellationToken);

        item.SourceProjectId = request.SourceProjectId;
        item.DesignCategoryId = request.DesignCategoryId;
        item.Title = request.Title.Trim();
        item.Description = (request.Description ?? string.Empty).Trim();
        item.ThumbnailUrl = NormalizeOptionalText(request.ThumbnailUrl);
        item.ProjectUrl = NormalizeOptionalText(request.ProjectUrl?.Trim());
        item.FileUrl = NormalizeOptionalText(request.FileUrl);
        item.CompletedAt = request.CompletedAt;
        item.IsFeatured = request.IsFeatured;
        item.UpdatedAt = DateTimeOffset.UtcNow;

        await ReplacePortfolioSkillLinksAsync(item.Id, profile.Id, request.StudentSkillIds, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await BuildPortfolioItemResponseAsync(item.Id, cancellationToken);
    }

    public async Task DeletePortfolioItemAsync(
        Guid userId,
        Guid portfolioItemId,
        CancellationToken cancellationToken = default)
    {
        var profile = await RequireActiveStudentOwnerProfileAsync(userId, cancellationToken);
        var item = await RequireOwnedPortfolioItemAsync(profile.Id, portfolioItemId, cancellationToken);

        unitOfWork.Repository<StudentPortfolioItem>().Remove(item);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<StudentPortfolioItemResponse> PublishPortfolioItemAsync(
        Guid userId,
        Guid portfolioItemId,
        CancellationToken cancellationToken = default)
    {
        var profile = await RequireActiveStudentOwnerProfileAsync(userId, cancellationToken);
        var item = await RequireOwnedPortfolioItemAsync(profile.Id, portfolioItemId, cancellationToken);

        if (item.Status == PortfolioItemStatus.HIDDEN)
        {
            throw new InvalidOperationException("Hidden portfolio items cannot be published.");
        }

        await ValidatePortfolioPublishAsync(profile.Id, item, cancellationToken);

        item.Status = PortfolioItemStatus.PUBLIC;
        item.PublishedAt ??= DateTimeOffset.UtcNow;
        item.UpdatedAt = DateTimeOffset.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await BuildPortfolioItemResponseAsync(item.Id, cancellationToken);
    }

    public async Task<StudentPortfolioItemResponse> UnpublishPortfolioItemAsync(
        Guid userId,
        Guid portfolioItemId,
        CancellationToken cancellationToken = default)
    {
        var profile = await RequireActiveStudentOwnerProfileAsync(userId, cancellationToken);
        var item = await RequireOwnedPortfolioItemAsync(profile.Id, portfolioItemId, cancellationToken);

        item.Status = PortfolioItemStatus.PRIVATE;
        item.UpdatedAt = DateTimeOffset.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await BuildPortfolioItemResponseAsync(item.Id, cancellationToken);
    }

    public async Task<IReadOnlyList<StudentPortfolioItemResponse>> ListStudentPortfolioForViewerAsync(
        Guid viewerUserId,
        Guid studentProfileId,
        CancellationToken cancellationToken = default)
    {
        var viewer = await RequireUserAsync(viewerUserId, cancellationToken);
        EnsureViewerCanReadStudentProfile(viewer);

        var visibleStatuses = viewer.Role == UserRole.ADMIN
            ? (PortfolioItemStatus[]?)null
            : [PortfolioItemStatus.PUBLIC];

        await RequireStudentProfileAsync(studentProfileId, cancellationToken);
        return await BuildPortfolioResponsesAsync(studentProfileId, visibleStatuses, cancellationToken);
    }

    public async Task<PublicStudentProfileResponse> GetStudentProfileForViewerAsync(
        Guid viewerUserId,
        Guid studentProfileId,
        CancellationToken cancellationToken = default)
    {
        var viewer = await RequireUserAsync(viewerUserId, cancellationToken);
        EnsureViewerCanReadStudentProfile(viewer);

        var profile = await RequireStudentProfileAsync(studentProfileId, cancellationToken);
        var studentUser = await RequireUserAsync(profile.UserId, cancellationToken);
        var allSkills = await ListSkillsByProfileIdAsync(profile.Id, cancellationToken);
        var portfolio = await ListStudentPortfolioForViewerAsync(viewerUserId, profile.Id, cancellationToken);

        return new PublicStudentProfileResponse(
            profile.Id,
            studentUser.Id,
            studentUser.FullName,
            studentUser.AvatarUrl,
            profile.School,
            profile.Major,
            profile.StudyStartYear,
            profile.Bio,
            profile.VerificationStatus,
            profile.AverageRating,
            profile.CompletedProjectsCount,
            allSkills,
            allSkills.Where(skill => skill.IsHighlighted).ToList(),
            portfolio,
            portfolio.Where(item => item.IsFeatured).ToList());
    }

    public async Task<StudentCapabilitySummaryResponse> GetStudentCapabilitySummaryAsync(
        Guid studentProfileId,
        Guid? designCategoryId = null,
        CancellationToken cancellationToken = default)
    {
        var summaries = await GetStudentCapabilitySummariesAsync([studentProfileId], designCategoryId, cancellationToken);
        return summaries.TryGetValue(studentProfileId, out var summary)
            ? summary
            : throw new InvalidOperationException("Student capability summary was not found.");
    }

    public async Task<IReadOnlyDictionary<Guid, StudentCapabilitySummaryResponse>> GetStudentCapabilitySummariesAsync(
        IReadOnlyList<Guid> studentProfileIds,
        Guid? designCategoryId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedIds = studentProfileIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (normalizedIds.Count == 0)
        {
            return new Dictionary<Guid, StudentCapabilitySummaryResponse>();
        }

        var profiles = await unitOfWork.Repository<StudentProfile>().Query()
            .Where(profile => normalizedIds.Contains(profile.Id))
            .ToListAsync(cancellationToken);

        if (profiles.Count == 0)
        {
            return new Dictionary<Guid, StudentCapabilitySummaryResponse>();
        }

        var userIds = profiles
            .Select(profile => profile.UserId)
            .Distinct()
            .ToList();

        var users = await unitOfWork.Repository<User>().Query()
            .Where(user => userIds.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id, cancellationToken);

        var skills = await unitOfWork.Repository<StudentSkill>().Query()
            .Where(skill => normalizedIds.Contains(skill.StudentProfileId))
            .OrderByDescending(skill => skill.IsHighlighted)
            .ThenBy(skill => skill.SkillName)
            .Select(skill => new StudentSkillResponse(
                skill.Id,
                skill.StudentProfileId,
                skill.SkillName,
                skill.Level,
                skill.YearsOfExperience,
                skill.ExperienceNote,
                skill.IsHighlighted,
                skill.CreatedAt,
                skill.UpdatedAt))
            .ToListAsync(cancellationToken);

        var publicPortfolio = await BuildPortfolioResponsesAsync(
            normalizedIds,
            [PortfolioItemStatus.PUBLIC],
            null,
            cancellationToken);

        var skillsByProfile = skills
            .GroupBy(skill => skill.StudentProfileId)
            .ToDictionary(group => group.Key, group => (IReadOnlyList<StudentSkillResponse>)group.ToList());

        var portfolioByProfile = publicPortfolio
            .GroupBy(item => item.StudentProfileId)
            .ToDictionary(group => group.Key, group => (IReadOnlyList<StudentPortfolioItemResponse>)group.ToList());

        var summaries = new Dictionary<Guid, StudentCapabilitySummaryResponse>(profiles.Count);
        foreach (var profile in profiles)
        {
            if (!users.TryGetValue(profile.UserId, out var user))
            {
                continue;
            }

            var profileSkills = skillsByProfile.TryGetValue(profile.Id, out var studentSkills) ? studentSkills : [];
            var profilePortfolio = portfolioByProfile.TryGetValue(profile.Id, out var portfolioItems) ? portfolioItems : [];
            var relatedSkills = BuildRelatedSkills(profile.Id, profileSkills, profilePortfolio, designCategoryId);

            summaries[profile.Id] = new StudentCapabilitySummaryResponse(
                profile.Id,
                new StudentBasicProfileSummaryResponse(
                    profile.Id,
                    user.Id,
                    user.FullName,
                    profile.School,
                    profile.Major,
                    profile.Bio,
                    profile.VerificationStatus,
                    profile.AverageRating,
                    profile.CompletedProjectsCount),
                BuildSkillsSummary(profileSkills),
                BuildPortfolioSummary(profilePortfolio),
                profileSkills,
                profilePortfolio,
                profileSkills.Where(skill => skill.IsHighlighted).ToList(),
                profilePortfolio.Where(item => item.IsFeatured).ToList(),
                relatedSkills);
        }

        return summaries;
    }

    private async Task ReplacePortfolioSkillLinksAsync(
        Guid portfolioItemId,
        Guid studentProfileId,
        IReadOnlyList<Guid>? studentSkillIds,
        CancellationToken cancellationToken)
    {
        var normalizedIds = (studentSkillIds ?? [])
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        var links = await unitOfWork.Repository<StudentPortfolioItemSkill>().Query()
            .Where(link => link.PortfolioItemId == portfolioItemId)
            .ToListAsync(cancellationToken);

        foreach (var link in links)
        {
            unitOfWork.Repository<StudentPortfolioItemSkill>().Remove(link);
        }

        if (normalizedIds.Count == 0)
        {
            return;
        }

        var ownedSkillIds = await unitOfWork.Repository<StudentSkill>().Query()
            .Where(skill => skill.StudentProfileId == studentProfileId && normalizedIds.Contains(skill.Id))
            .Select(skill => skill.Id)
            .ToListAsync(cancellationToken);

        if (ownedSkillIds.Count != normalizedIds.Count)
        {
            throw new InvalidOperationException("Portfolio skills must belong to the current student.");
        }

        var now = DateTimeOffset.UtcNow;
        for (var index = 0; index < normalizedIds.Count; index++)
        {
            await unitOfWork.Repository<StudentPortfolioItemSkill>().AddAsync(
                new StudentPortfolioItemSkill
                {
                    Id = Guid.NewGuid(),
                    PortfolioItemId = portfolioItemId,
                    StudentSkillId = normalizedIds[index],
                    DisplayOrder = index,
                    CreatedAt = now
                },
                cancellationToken);
        }
    }

    private async Task ValidatePortfolioRequestAsync(
        Guid studentProfileId,
        UpsertStudentPortfolioItemRequest request,
        CancellationToken cancellationToken)
    {
        if (request.DesignCategoryId.HasValue)
        {
            var categoryExists = await unitOfWork.Repository<DesignCategory>().AnyAsync(
                category => category.Id == request.DesignCategoryId.Value && category.IsActive,
                cancellationToken);

            if (!categoryExists)
            {
                throw new InvalidOperationException("Design category was not found or is inactive.");
            }
        }

        if (request.SourceProjectId.HasValue)
        {
            await ValidateSourceProjectAsync(studentProfileId, request.SourceProjectId.Value, cancellationToken);
        }

        var normalizedSkillIds = (request.StudentSkillIds ?? [])
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (normalizedSkillIds.Count == 0)
        {
            return;
        }

        var ownedSkillCount = await unitOfWork.Repository<StudentSkill>().Query()
            .CountAsync(
                skill => skill.StudentProfileId == studentProfileId && normalizedSkillIds.Contains(skill.Id),
                cancellationToken);

        if (ownedSkillCount != normalizedSkillIds.Count)
        {
            throw new InvalidOperationException("Portfolio skills must belong to the current student.");
        }
    }

    private async Task ValidatePortfolioPublishAsync(
        Guid studentProfileId,
        StudentPortfolioItem item,
        CancellationToken cancellationToken)
    {
        if (item.SourceProjectId.HasValue)
        {
            await ValidateSourceProjectAsync(studentProfileId, item.SourceProjectId.Value, cancellationToken);
        }
    }

    private async Task ValidateSourceProjectAsync(
        Guid studentProfileId,
        Guid sourceProjectId,
        CancellationToken cancellationToken)
    {
        var project = await unitOfWork.Repository<Project>().GetByIdAsync(sourceProjectId, cancellationToken)
            ?? throw new InvalidOperationException("Source project was not found.");

        if (project.SelectedStudentProfileId != studentProfileId)
        {
            throw new UnauthorizedAccessException("Student can only reference their own completed projects.");
        }

        if (project.Status != ProjectStatus.COMPLETED)
        {
            throw new InvalidOperationException("Only completed projects can be referenced in portfolio.");
        }

        if (project.IsConfidential || !project.AllowStudentPortfolio)
        {
            throw new InvalidOperationException("This project cannot be published in student portfolio.");
        }
    }

    private async Task<StudentPortfolioItemResponse> BuildPortfolioItemResponseAsync(
        Guid portfolioItemId,
        CancellationToken cancellationToken)
    {
        var item = await BuildPortfolioResponsesAsync(
            null,
            null,
            portfolioItemId,
            cancellationToken);

        return item.Single();
    }

    private async Task<IReadOnlyList<StudentPortfolioItemResponse>> BuildPortfolioResponsesAsync(
        Guid? studentProfileId,
        PortfolioItemStatus[]? visibleStatuses,
        CancellationToken cancellationToken)
    {
        return await BuildPortfolioResponsesAsync(
            studentProfileId.HasValue ? [studentProfileId.Value] : null,
            visibleStatuses,
            null,
            cancellationToken);
    }

    private async Task<IReadOnlyList<StudentPortfolioItemResponse>> BuildPortfolioResponsesAsync(
        IReadOnlyList<Guid>? studentProfileIds,
        PortfolioItemStatus[]? visibleStatuses,
        Guid? portfolioItemId,
        CancellationToken cancellationToken)
    {
        var normalizedProfileIds = studentProfileIds?
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        var itemsQuery =
            from item in unitOfWork.Repository<StudentPortfolioItem>().Query()
            join category in unitOfWork.Repository<DesignCategory>().Query()
                on item.DesignCategoryId equals category.Id into categoryJoin
            from category in categoryJoin.DefaultIfEmpty()
            where (normalizedProfileIds == null || normalizedProfileIds.Contains(item.StudentProfileId)) &&
                  (!portfolioItemId.HasValue || item.Id == portfolioItemId.Value) &&
                  (visibleStatuses == null || visibleStatuses.Contains(item.Status))
            orderby item.IsFeatured descending, item.UpdatedAt descending
            select new
            {
                Item = item,
                DesignCategoryName = category != null ? category.Name : null
            };

        var items = await itemsQuery.ToListAsync(cancellationToken);
        if (items.Count == 0)
        {
            return [];
        }

        var itemIds = items.Select(row => row.Item.Id).ToList();
        var skillsByItem = await (
            from link in unitOfWork.Repository<StudentPortfolioItemSkill>().Query()
            join skill in unitOfWork.Repository<StudentSkill>().Query()
                on link.StudentSkillId equals skill.Id
            where itemIds.Contains(link.PortfolioItemId)
            orderby link.DisplayOrder, skill.SkillName
            select new
            {
                link.PortfolioItemId,
                Skill = new StudentSkillReferenceResponse(
                    skill.Id,
                    skill.SkillName,
                    skill.Level,
                    skill.IsHighlighted)
            }).ToListAsync(cancellationToken);

        var groupedSkills = skillsByItem
            .GroupBy(row => row.PortfolioItemId)
            .ToDictionary(group => group.Key, group => (IReadOnlyList<StudentSkillReferenceResponse>)group.Select(row => row.Skill).ToList());

        return items.Select(row => new StudentPortfolioItemResponse(
            row.Item.Id,
            row.Item.StudentProfileId,
            row.Item.SourceProjectId,
            row.Item.DesignCategoryId,
            row.DesignCategoryName,
            row.Item.Title,
            row.Item.Description,
            row.Item.ThumbnailUrl,
            row.Item.ProjectUrl,
            row.Item.FileUrl,
            row.Item.CompletedAt,
            row.Item.Status,
            row.Item.Status == PortfolioItemStatus.PUBLIC,
            row.Item.IsFeatured,
            groupedSkills.TryGetValue(row.Item.Id, out var skills) ? skills : [],
            row.Item.PublishedAt,
            row.Item.CreatedAt,
            row.Item.UpdatedAt)).ToList();
    }

    private async Task<IReadOnlyList<StudentSkillResponse>> ListSkillsByProfileIdAsync(
        Guid studentProfileId,
        CancellationToken cancellationToken)
    {
        return await unitOfWork.Repository<StudentSkill>().Query()
            .Where(skill => skill.StudentProfileId == studentProfileId)
            .OrderByDescending(skill => skill.IsHighlighted)
            .ThenBy(skill => skill.SkillName)
            .Select(skill => new StudentSkillResponse(
                skill.Id,
                skill.StudentProfileId,
                skill.SkillName,
                skill.Level,
                skill.YearsOfExperience,
                skill.ExperienceNote,
                skill.IsHighlighted,
                skill.CreatedAt,
                skill.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    private static IReadOnlyList<StudentSkillResponse> BuildRelatedSkills(
        Guid studentProfileId,
        IReadOnlyList<StudentSkillResponse> skills,
        IReadOnlyList<StudentPortfolioItemResponse> publicPortfolio,
        Guid? designCategoryId)
    {
        if (!designCategoryId.HasValue)
        {
            return [];
        }

        return publicPortfolio
            .Where(item => item.DesignCategoryId == designCategoryId.Value)
            .SelectMany(item => item.SkillsUsed)
            .GroupBy(item => item.Id)
            .Select(group => new StudentSkillResponse(
                group.First().Id,
                studentProfileId,
                group.First().SkillName,
                group.First().Level,
                skills.FirstOrDefault(skill => skill.Id == group.Key)?.YearsOfExperience,
                skills.FirstOrDefault(skill => skill.Id == group.Key)?.ExperienceNote,
                group.First().IsHighlighted,
                skills.FirstOrDefault(skill => skill.Id == group.Key)?.CreatedAt ?? default,
                skills.FirstOrDefault(skill => skill.Id == group.Key)?.UpdatedAt ?? default))
            .ToList();
    }

    private async Task<StudentProfile> RequireActiveStudentOwnerProfileAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(userId, cancellationToken);

        if (user.Role != UserRole.STUDENT)
        {
            throw new InvalidOperationException("Only STUDENT users can manage skills and portfolio.");
        }

        if (user.Status != UserStatus.ACTIVE)
        {
            throw new UnauthorizedAccessException("Only ACTIVE students can manage skills and portfolio.");
        }

        var profile = await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
            value => value.UserId == userId,
            cancellationToken);

        return profile ?? throw new InvalidOperationException("Student profile must be created first.");
    }

    private async Task<User> RequireUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken);
        return user ?? throw new UnauthorizedAccessException("User not found.");
    }

    private async Task<StudentProfile> RequireStudentProfileAsync(Guid studentProfileId, CancellationToken cancellationToken)
    {
        var profile = await unitOfWork.Repository<StudentProfile>().GetByIdAsync(studentProfileId, cancellationToken);
        return profile ?? throw new InvalidOperationException("Student profile was not found.");
    }

    private async Task<StudentSkill> RequireOwnedSkillAsync(
        Guid studentProfileId,
        Guid skillId,
        CancellationToken cancellationToken)
    {
        var skill = await unitOfWork.Repository<StudentSkill>().FirstOrDefaultAsync(
            value => value.Id == skillId && value.StudentProfileId == studentProfileId,
            cancellationToken);

        return skill ?? throw new InvalidOperationException("Student skill was not found.");
    }

    private async Task<StudentPortfolioItem> RequireOwnedPortfolioItemAsync(
        Guid studentProfileId,
        Guid portfolioItemId,
        CancellationToken cancellationToken)
    {
        var item = await unitOfWork.Repository<StudentPortfolioItem>().FirstOrDefaultAsync(
            value => value.Id == portfolioItemId && value.StudentProfileId == studentProfileId,
            cancellationToken);

        return item ?? throw new InvalidOperationException("Portfolio item was not found.");
    }

    private static void EnsureViewerCanReadStudentProfile(User viewer)
    {
        if (viewer.Role is not UserRole.SME and not UserRole.ADMIN)
        {
            throw new UnauthorizedAccessException("Only SME and ADMIN users can view student public profiles.");
        }
    }

    private static StudentSkillResponse ToStudentSkillResponse(StudentSkill skill)
    {
        return new StudentSkillResponse(
            skill.Id,
            skill.StudentProfileId,
            skill.SkillName,
            skill.Level,
            skill.YearsOfExperience,
            skill.ExperienceNote,
            skill.IsHighlighted,
            skill.CreatedAt,
            skill.UpdatedAt);
    }

    private static string NormalizeSkillName(string value)
    {
        var trimmed = value.Trim();
        trimmed = MultiWhitespaceRegex().Replace(trimmed, " ");
        return trimmed.ToUpperInvariant();
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string BuildSkillsSummary(IReadOnlyList<StudentSkillResponse> skills)
    {
        if (skills.Count == 0)
        {
            return "Student chưa khai báo kỹ năng.";
        }

        return string.Join(", ", skills
            .OrderByDescending(skill => skill.IsHighlighted)
            .ThenBy(skill => skill.SkillName)
            .Take(8)
            .Select(skill => skill.SkillName));
    }

    private static string BuildPortfolioSummary(IReadOnlyList<StudentPortfolioItemResponse> portfolio)
    {
        if (portfolio.Count == 0)
        {
            return "Student chưa có portfolio công khai.";
        }

        var builder = new StringBuilder();
        foreach (var item in portfolio.Take(3))
        {
            if (builder.Length > 0)
            {
                builder.Append(" | ");
            }

            builder.Append(item.Title);
            if (!string.IsNullOrWhiteSpace(item.DesignCategoryName))
            {
                builder.Append(" (");
                builder.Append(item.DesignCategoryName);
                builder.Append(')');
            }
        }

        return builder.ToString();
    }

    [GeneratedRegex("\\s+")]
    private static partial Regex MultiWhitespaceRegex();
}
