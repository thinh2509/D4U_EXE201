namespace D4U.Api.Application.Features.Projects;

using D4U.Api.Domain.Entities;
using Microsoft.AspNetCore.Http;

public interface ISubmissionFileService
{
    Task<SubmissionUploadResponse> UploadAsync(
        Guid userId,
        IFormFile file,
        CancellationToken cancellationToken = default);

    Task<FileAsset> GetDownloadAsync(
        Guid userId,
        Guid fileId,
        CancellationToken cancellationToken = default);

    string GetAbsolutePath(FileAsset file);
}
