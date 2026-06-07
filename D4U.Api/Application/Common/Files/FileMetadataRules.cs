namespace D4U.Api.Application.Common.Files;

public static class FileMetadataRules
{
    public static readonly string[] AllowedExtensions = ["jpg", "png", "pdf"];

    public static string NormalizeExtension(string? extension)
    {
        return string.IsNullOrWhiteSpace(extension)
            ? string.Empty
            : extension.Trim().TrimStart('.').ToLowerInvariant();
    }

    public static bool IsAllowedExtension(string? extension)
    {
        return AllowedExtensions.Contains(NormalizeExtension(extension));
    }
}
