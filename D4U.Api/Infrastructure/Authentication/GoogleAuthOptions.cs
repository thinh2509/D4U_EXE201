namespace D4U.Api.Infrastructure.Authentication;

public sealed class GoogleAuthOptions
{
    public const string SectionName = "GoogleAuth";

    public string ClientId { get; init; } = string.Empty;

    public string MetadataAddress { get; init; } = "https://accounts.google.com/.well-known/openid-configuration";
}
