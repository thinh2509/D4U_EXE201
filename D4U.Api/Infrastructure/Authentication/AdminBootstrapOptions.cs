namespace D4U.Api.Infrastructure.Authentication;

public sealed class AdminBootstrapOptions
{
    public const string SectionName = "Admin";

    public string Email { get; init; } = string.Empty;

    public string Username { get; init; } = "admin";

    public string Password { get; init; } = string.Empty;

    public string FullName { get; init; } = "D4U Admin";
}
