namespace D4U.Api.Application.Features.Projects;

using System.Security.Cryptography;
using D4U.Api.Application.Common.Data;
using D4U.Api.Application.Common.Files;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

public sealed class SubmissionFileService(
    IUnitOfWork unitOfWork,
    IWebHostEnvironment environment) : ISubmissionFileService
{
    private const long MaxFileSizeBytes = 20 * 1024 * 1024;

    public async Task<SubmissionUploadResponse> UploadAsync(
        Guid userId,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("User was not found.");

        if (user.Role != UserRole.STUDENT)
        {
            throw new InvalidOperationException("Only Student users can upload submission files.");
        }

        if (file.Length <= 0 || file.Length > MaxFileSizeBytes)
        {
            throw new InvalidOperationException("Submission file must be between 1 byte and 20 MB.");
        }

        var originalFilename = Path.GetFileName(file.FileName);
        var extension = FileMetadataRules.NormalizeExtension(Path.GetExtension(originalFilename));
        if (!FileMetadataRules.IsAllowedExtension(extension))
        {
            throw new InvalidOperationException("Submission file extension must be jpg, png, or pdf.");
        }

        var uploadsRoot = Path.Combine(environment.ContentRootPath, "App_Data", "uploads");
        var relativeStorageKey = Path.Combine("submissions", userId.ToString("N"), $"{Guid.NewGuid():N}.{extension}");
        var absolutePath = Path.Combine(uploadsRoot, relativeStorageKey);
        Directory.CreateDirectory(Path.GetDirectoryName(absolutePath)!);

        string checksum;
        await using (var output = File.Create(absolutePath))
        await using (var input = file.OpenReadStream())
        {
            using var sha256 = SHA256.Create();
            var buffer = new byte[81920];
            int read;

            while ((read = await input.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken)) > 0)
            {
                await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
                sha256.TransformBlock(buffer, 0, read, null, 0);
            }

            sha256.TransformFinalBlock([], 0, 0);
            checksum = Convert.ToHexString(sha256.Hash ?? []);
        }

        var fileAsset = new FileAsset
        {
            Id = Guid.NewGuid(),
            OwnerUserId = userId,
            StorageProvider = "LOCAL",
            StorageKey = relativeStorageKey.Replace('\\', '/'),
            OriginalFilename = originalFilename,
            MimeType = GetMimeType(extension),
            FileExtension = extension,
            FileSizeBytes = file.Length,
            Checksum = checksum,
            Visibility = "PRIVATE",
            ScanStatus = "NOT_SCANNED",
            CreatedAt = DateTimeOffset.UtcNow
        };

        await unitOfWork.Repository<FileAsset>().AddAsync(fileAsset, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ToUploadResponse(fileAsset);
    }

    public async Task<FileAsset> GetDownloadAsync(
        Guid userId,
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("User was not found.");
        var file = await unitOfWork.Repository<FileAsset>().GetByIdAsync(fileId, cancellationToken)
            ?? throw new InvalidOperationException("File was not found.");

        if (file.DeletedAt is not null)
        {
            throw new InvalidOperationException("Deleted files cannot be downloaded.");
        }

        if (user.Role == UserRole.ADMIN || file.OwnerUserId == userId)
        {
            return file;
        }

        if (user.Role == UserRole.SME)
        {
            var canDownload = await (
                from submissionFile in unitOfWork.Repository<SubmissionFile>().Query()
                join submission in unitOfWork.Repository<ProjectSubmission>().Query()
                    on submissionFile.SubmissionId equals submission.Id
                join project in unitOfWork.Repository<Project>().Query()
                    on submission.ProjectId equals project.Id
                join smeProfile in unitOfWork.Repository<SmeProfile>().Query()
                    on project.SmeProfileId equals smeProfile.Id
                where smeProfile.UserId == userId &&
                    (submissionFile.FileId == fileId || submissionFile.WatermarkedFileId == fileId)
                select submissionFile.Id)
                .AnyAsync(cancellationToken);

            if (canDownload)
            {
                return file;
            }
        }

        throw new UnauthorizedAccessException("User cannot download this file.");
    }

    public string GetAbsolutePath(FileAsset file)
    {
        var uploadsRoot = Path.GetFullPath(Path.Combine(environment.ContentRootPath, "App_Data", "uploads"));
        var absolutePath = Path.GetFullPath(Path.Combine(uploadsRoot, file.StorageKey));
        var rootWithSeparator = uploadsRoot.EndsWith(Path.DirectorySeparatorChar)
            ? uploadsRoot
            : uploadsRoot + Path.DirectorySeparatorChar;

        if (!absolutePath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Stored file path is invalid.");
        }

        return absolutePath;
    }

    private static SubmissionUploadResponse ToUploadResponse(FileAsset file)
    {
        return new SubmissionUploadResponse(
            file.Id,
            file.OriginalFilename,
            file.MimeType,
            file.FileExtension,
            file.FileSizeBytes,
            $"/api/v1/files/{file.Id}/download");
    }

    private static string GetMimeType(string extension)
    {
        return extension switch
        {
            "jpg" => "image/jpeg",
            "png" => "image/png",
            "pdf" => "application/pdf",
            _ => "application/octet-stream"
        };
    }
}
