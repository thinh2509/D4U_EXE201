namespace D4U.Api.Infrastructure.Ai;

public sealed class AiOptions
{
    public const string SectionName = "Ai";

    public string Provider { get; init; } = "Mock";

    public string ApiKey { get; init; } = string.Empty;

    public string Model { get; init; } = "mock-project-brief-v1";

    public int TimeoutSeconds { get; init; } = 30;
}

