namespace D4U.Api.Infrastructure.Files;

using D4U.Api.Application.Common.Files;

public sealed class LocalUploadPathResolver(
    IConfiguration configuration,
    IWebHostEnvironment environment) : IUploadPathResolver
{
    public string GetUploadsRoot()
    {
        var configuredRoot = configuration["Uploads:RootPath"];
        var root = string.IsNullOrWhiteSpace(configuredRoot)
            ? Path.Combine(environment.ContentRootPath, "App_Data", "uploads")
            : configuredRoot;

        return Path.GetFullPath(root);
    }

    public string GetAbsolutePath(string storageKey)
    {
        var uploadsRoot = GetUploadsRoot();
        var absolutePath = Path.GetFullPath(Path.Combine(uploadsRoot, storageKey));
        var uploadsRootWithSeparator = uploadsRoot.EndsWith(Path.DirectorySeparatorChar)
            ? uploadsRoot
            : uploadsRoot + Path.DirectorySeparatorChar;

        if (!absolutePath.StartsWith(uploadsRootWithSeparator, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Stored file path is invalid.");
        }

        return absolutePath;
    }
}
