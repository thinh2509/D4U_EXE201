namespace D4U.Api.Application.Features.Ai;

public sealed record AiProjectBriefAssistantRequest(
    string RawIdea,
    string? BusinessField,
    string? TargetAudience,
    string? PreferredStyle,
    decimal? BudgetAmount,
    DateTimeOffset? TotalDeadline);

public sealed record AiProjectBriefAssistantResponse(
    string SuggestedTitle,
    string SuggestedBrief,
    string SuggestedUsagePurpose,
    IReadOnlyList<string> SuggestedDeliverables,
    string SuggestedCategoryHint,
    DateTimeOffset? SuggestedSketchDeadline,
    DateTimeOffset? SuggestedFinalDeadline,
    IReadOnlyList<string> DeadlineNotes,
    IReadOnlyList<string> Warnings,
    string Provider);

