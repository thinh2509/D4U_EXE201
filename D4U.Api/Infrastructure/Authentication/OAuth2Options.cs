namespace D4U.Api.Infrastructure.Authentication;

public sealed class OAuth2Options
{
    public const string SectionName = "OAuth2";

    public bool Enabled { get; init; }

    public string AuthorizationEndpoint { get; init; } = string.Empty;

    public string TokenEndpoint { get; init; } = string.Empty;

    public string UserInformationEndpoint { get; init; } = string.Empty;

    public string ClientId { get; init; } = string.Empty;

    public string ClientSecret { get; init; } = string.Empty;

    public string CallbackPath { get; init; } = "/signin-oauth";
}
