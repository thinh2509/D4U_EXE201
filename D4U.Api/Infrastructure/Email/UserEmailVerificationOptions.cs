namespace D4U.Api.Infrastructure.Email;

public sealed class UserEmailVerificationOptions
{
    public const string SectionName = "UserEmailVerification";

    public int CodeExpiresMinutes { get; init; } = 15;

    public int CodeLength { get; init; } = 6;
}
