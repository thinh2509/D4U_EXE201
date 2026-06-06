namespace D4U.Api.Application.Common.Files;

public interface IUploadPathResolver
{
    string GetUploadsRoot();

    string GetAbsolutePath(string storageKey);
}
