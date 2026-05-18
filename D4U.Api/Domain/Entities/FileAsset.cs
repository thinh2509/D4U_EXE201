namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class FileAsset
{
    public Guid Id { get; set; }
    public Guid? OwnerUserId { get; set; }
    public string StorageProvider { get; set; } = string.Empty;
    public string? Bucket { get; set; }
    public string StorageKey { get; set; } = string.Empty;
    public string OriginalFilename { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Checksum { get; set; }
    public string Visibility { get; set; } = "PRIVATE";
    public string? ScanStatus { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}

