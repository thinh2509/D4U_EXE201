namespace D4U.Api.Infrastructure.EmailVerification;

public sealed class StudentEmailVerificationOptions
{
    public const string SectionName = "StudentEmailVerification";

    public string[] AllowedDomains { get; init; } = ["edu", "edu.vn"];

    public int CodeExpiresMinutes { get; init; } = 15;

    public int CodeLength { get; init; } = 6;
}
