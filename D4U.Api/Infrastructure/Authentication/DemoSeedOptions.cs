namespace D4U.Api.Infrastructure.Authentication;

public sealed class DemoSeedOptions
{
    public const string SectionName = "DemoSeed";

    public bool Enabled { get; init; }

    public string Password { get; init; } = "Admin12345";

    public string StudentEmail { get; init; } = "student.demo@d4u.local";

    public string SmeEmail { get; init; } = "sme.demo@d4u.local";
}
