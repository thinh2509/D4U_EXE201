namespace D4U.Api.Infrastructure.Ai;

using D4U.Api.Application.Features.Ai;
using Microsoft.Extensions.Options;

public sealed class MockAiProjectBriefAssistant(IOptions<AiOptions> aiOptions) : IAiProjectBriefAssistant
{
    public Task<AiProjectBriefAssistantResponse> GenerateAsync(
        AiProjectBriefAssistantRequest request,
        CancellationToken cancellationToken = default)
    {
        var rawIdea = Normalize(request.RawIdea);
        var businessField = NormalizeOptional(request.BusinessField) ?? "the SME business";
        var targetAudience = NormalizeOptional(request.TargetAudience) ?? "the target customers";
        var preferredStyle = NormalizeOptional(request.PreferredStyle) ?? "clear, professional, and brand-aligned";
        var categoryHint = InferCategory(rawIdea, businessField, preferredStyle);
        var title = BuildTitle(rawIdea, businessField, categoryHint);
        var deliverables = BuildDeliverables(categoryHint);
        var deadlinePlan = BuildDeadlinePlan(request.TotalDeadline);
        var warnings = BuildWarnings(request);

        var brief = string.Join(
            Environment.NewLine,
            $"Create a {preferredStyle} design solution for {businessField}.",
            $"The project should address this need: {rawIdea}",
            $"The design should be suitable for {targetAudience}, easy to understand, and ready for SME review before final delivery.");

        var usagePurpose = categoryHint switch
        {
            "Logo & Brand Identity" => "Use the design as the main visual identity across digital and print brand touchpoints.",
            "Social Media Design" => "Use the design for social posts, ads, and campaign communication.",
            "Packaging Design" => "Use the design for product packaging and customer-facing retail presentation.",
            "UI/UX Design" => "Use the design to clarify the digital user experience and interface direction.",
            "Print Design" => "Use the design for offline marketing and printed customer communication.",
            _ => "Use the design to communicate the SME's message clearly to the intended audience."
        };

        var response = new AiProjectBriefAssistantResponse(
            title,
            brief,
            usagePurpose,
            deliverables,
            categoryHint,
            deadlinePlan.SketchDeadline,
            deadlinePlan.FinalDeadline,
            deadlinePlan.Notes,
            warnings,
            aiOptions.Value.Provider);

        return Task.FromResult(response);
    }

    private static string Normalize(string value)
    {
        return value.Trim();
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string InferCategory(
        string rawIdea,
        string businessField,
        string preferredStyle)
    {
        var text = $"{rawIdea} {businessField} {preferredStyle}".ToLowerInvariant();

        if (ContainsAny(text, "logo", "brand", "identity", "nhan dien", "thuong hieu"))
        {
            return "Logo & Brand Identity";
        }

        if (ContainsAny(text, "social", "facebook", "instagram", "tiktok", "post", "banner", "ads"))
        {
            return "Social Media Design";
        }

        if (ContainsAny(text, "packaging", "package", "label", "box", "bao bi", "nhan san pham"))
        {
            return "Packaging Design";
        }

        if (ContainsAny(text, "website", "app", "mobile", "ui", "ux", "landing page", "dashboard"))
        {
            return "UI/UX Design";
        }

        if (ContainsAny(text, "poster", "flyer", "brochure", "menu", "print", "in an"))
        {
            return "Print Design";
        }

        if (ContainsAny(text, "illustration", "icon", "mascot", "character", "minh hoa"))
        {
            return "Illustration";
        }

        return "Logo & Brand Identity";
    }

    private static bool ContainsAny(string text, params string[] keywords)
    {
        return keywords.Any(text.Contains);
    }

    private static string BuildTitle(
        string rawIdea,
        string businessField,
        string categoryHint)
    {
        var prefix = categoryHint switch
        {
            "Logo & Brand Identity" => "Brand Identity Design",
            "Social Media Design" => "Social Media Visual Design",
            "Packaging Design" => "Packaging Design",
            "UI/UX Design" => "UI/UX Design",
            "Print Design" => "Print Design",
            "Illustration" => "Illustration Design",
            _ => "Design Project"
        };

        var normalizedBusiness = businessField == "the SME business" ? ExtractShortIdea(rawIdea) : businessField;
        return $"{prefix} for {normalizedBusiness}";
    }

    private static string ExtractShortIdea(string rawIdea)
    {
        var sentence = rawIdea.Split(['.', ',', ';', '\n'], StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        sentence = string.IsNullOrWhiteSpace(sentence) ? rawIdea : sentence;

        return sentence.Length <= 60 ? sentence.Trim() : $"{sentence[..57].Trim()}...";
    }

    private static IReadOnlyList<string> BuildDeliverables(string categoryHint)
    {
        return categoryHint switch
        {
            "Logo & Brand Identity" =>
            [
                "Primary logo concept",
                "Logo color variations",
                "Typography and color palette",
                "Basic brand usage notes"
            ],
            "Social Media Design" =>
            [
                "Social post design direction",
                "Campaign key visual",
                "Reusable layout templates",
                "Export-ready image files"
            ],
            "Packaging Design" =>
            [
                "Packaging front design",
                "Packaging side/back layout",
                "Print-ready PDF preview",
                "Source file handoff notes"
            ],
            "UI/UX Design" =>
            [
                "User flow outline",
                "Wireframe or low-fidelity layout",
                "High-fidelity key screens",
                "UI style notes"
            ],
            "Print Design" =>
            [
                "Print layout concept",
                "Final print-ready PDF",
                "Exported preview image",
                "Source file handoff notes"
            ],
            _ =>
            [
                "Initial visual concept",
                "Final approved design",
                "Export-ready files",
                "Source file handoff notes"
            ]
        };
    }

    private static DeadlinePlan BuildDeadlinePlan(DateTimeOffset? totalDeadline)
    {
        if (!totalDeadline.HasValue)
        {
            return new DeadlinePlan(
                null,
                null,
                ["Add a total deadline before publishing so Sketch and Final dates can be validated."]);
        }

        var now = DateTimeOffset.UtcNow;
        var totalDays = Math.Max(1, (totalDeadline.Value - now).TotalDays);
        var sketchDeadline = now.AddDays(Math.Max(1, Math.Floor(totalDays * 0.35)));
        var finalDeadline = now.AddDays(Math.Max(1, Math.Floor(totalDays * 0.8)));

        if (finalDeadline > totalDeadline.Value)
        {
            finalDeadline = totalDeadline.Value;
        }

        if (sketchDeadline > finalDeadline)
        {
            sketchDeadline = finalDeadline;
        }

        var notes = new List<string>
        {
            "Use the Sketch deadline for direction approval before final production.",
            "Use the Final deadline before the total project deadline to leave review time."
        };

        if (totalDays < 7)
        {
            notes.Add("The timeline is short; reduce deliverables or confirm availability before publishing.");
        }

        return new DeadlinePlan(sketchDeadline, finalDeadline, notes);
    }

    private static IReadOnlyList<string> BuildWarnings(AiProjectBriefAssistantRequest request)
    {
        var warnings = new List<string>();

        if (string.IsNullOrWhiteSpace(request.BusinessField))
        {
            warnings.Add("Business field is missing; category and brief suggestions may need SME review.");
        }

        if (string.IsNullOrWhiteSpace(request.TargetAudience))
        {
            warnings.Add("Target audience is missing; add it before publishing for clearer student applications.");
        }

        if (!request.BudgetAmount.HasValue)
        {
            warnings.Add("Budget is missing; subscription and publish validation will still require a valid budget.");
        }

        if (!request.TotalDeadline.HasValue)
        {
            warnings.Add("Total deadline is missing; deadline suggestions are limited.");
        }

        return warnings;
    }

    private sealed record DeadlinePlan(
        DateTimeOffset? SketchDeadline,
        DateTimeOffset? FinalDeadline,
        IReadOnlyList<string> Notes);
}
