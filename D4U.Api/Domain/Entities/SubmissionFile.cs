namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class SubmissionFile
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public Guid FileId { get; set; }
    public Guid? WatermarkedFileId { get; set; }
    public bool IsOriginalDownloadable { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

