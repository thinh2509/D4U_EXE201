namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class StudentSkill
{
    public Guid Id { get; set; }
    public Guid StudentProfileId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string NormalizedSkillName { get; set; } = string.Empty;
    public StudentSkillLevel Level { get; set; }
    public int? YearsOfExperience { get; set; }
    public string? ExperienceNote { get; set; }
    public bool IsHighlighted { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
