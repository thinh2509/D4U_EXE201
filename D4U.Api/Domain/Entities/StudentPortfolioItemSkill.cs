namespace D4U.Api.Domain.Entities;

public sealed class StudentPortfolioItemSkill
{
    public Guid Id { get; set; }
    public Guid PortfolioItemId { get; set; }
    public Guid StudentSkillId { get; set; }
    public int DisplayOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
