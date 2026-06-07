namespace D4U.Api.Infrastructure.Ai;

using D4U.Api.Application.Features.Ai;
using Microsoft.Extensions.Options;

public sealed class MockAiProjectBriefAssistant(IOptions<AiOptions> aiOptions) : IAiProjectBriefAssistant
{
    public Task<AiProjectBriefAssistantResponse> GenerateAsync(
        AiProjectBriefAssistantRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = GenerateVietnameseFallback(request, aiOptions.Value.Provider);
        return Task.FromResult(response);
    }

    public AiProjectBriefAssistantResponse GenerateVietnameseFallback(
        AiProjectBriefAssistantRequest request,
        string provider = "MockFallback",
        string? fallbackReason = null)
    {
        var rawIdea = Normalize(request.RawIdea);
        var businessField = NormalizeOptional(request.BusinessField) ?? "doanh nghiệp SME";
        var targetAudience = NormalizeOptional(request.TargetAudience) ?? "nhóm khách hàng mục tiêu cần được SME bổ sung";
        var preferredStyle = NormalizeOptional(request.PreferredStyle) ?? "rõ ràng, đáng tin cậy và phù hợp nhận diện thương hiệu";
        var categoryHint = InferCategory(rawIdea, businessField, preferredStyle);
        var title = BuildTitle(rawIdea, businessField, categoryHint);
        var deliverables = BuildDeliverables(categoryHint);
        var deadlinePlan = BuildDeadlinePlan(request.TotalDeadline);
        var warnings = BuildWarnings(request, fallbackReason);

        var brief = string.Join(
            Environment.NewLine + Environment.NewLine,
            $"Bối cảnh: {businessField} cần triển khai một dự án thiết kế thuộc nhóm {categoryHint} dựa trên ý tưởng: {rawIdea}.",
            $"Mục tiêu thiết kế: Làm rõ thông điệp chính, tăng độ nhận diện và tạo bộ tài liệu đủ cụ thể để Student Designer có thể bắt đầu thiết kế mà không phải đoán nhu cầu.",
            $"Khách hàng mục tiêu: {targetAudience}. Thiết kế cần ưu tiên ngôn ngữ hình ảnh dễ hiểu, phù hợp hành vi và kỳ vọng của nhóm này.",
            $"Phong cách mong muốn: {preferredStyle}. Student Designer cần giữ phong cách nhất quán giữa màu sắc, kiểu chữ, bố cục và hình ảnh minh họa.",
            "Yêu cầu nội dung/hình ảnh: Đề xuất hướng hình ảnh chính, bố cục, màu sắc chủ đạo và các nội dung cần xuất hiện. Nếu SME có logo, slogan hoặc hình ảnh sản phẩm, Student cần dùng làm tư liệu tham khảo.",
            "Tiêu chí nghiệm thu: Bản thiết kế phải đúng brief, dễ đọc ở kích thước sử dụng thực tế, có file preview để SME duyệt và có file bàn giao đúng định dạng đã thống nhất.",
            "Lưu ý cho Student Designer: Trình bày rõ ý tưởng ở bản Sketch, chỉ chuyển sang Final sau khi SME đã duyệt hướng thiết kế.");

        var usagePurpose = categoryHint switch
        {
            "Logo & Brand Identity" => "Sử dụng làm nền tảng nhận diện thương hiệu trên kênh online, ấn phẩm in và các điểm chạm khách hàng.",
            "Social Media Design" => "Sử dụng cho bài đăng, quảng cáo và truyền thông chiến dịch trên Facebook, Instagram, TikTok hoặc kênh social phù hợp.",
            "Packaging Design" => "Sử dụng cho bao bì, nhãn sản phẩm và hình ảnh trưng bày bán lẻ hướng tới khách hàng cuối.",
            "UI/UX Design" => "Sử dụng để định hình trải nghiệm người dùng, bố cục màn hình và hướng giao diện cho sản phẩm số.",
            "Print Design" => "Sử dụng cho tài liệu in ấn, truyền thông offline và các điểm chạm bán hàng trực tiếp.",
            _ => "Sử dụng để truyền tải thông điệp của SME một cách rõ ràng, nhất quán và dễ triển khai thực tế."
        };

        return new AiProjectBriefAssistantResponse(
            title,
            brief,
            usagePurpose,
            deliverables,
            categoryHint,
            deadlinePlan.SketchDeadline,
            deadlinePlan.FinalDeadline,
            deadlinePlan.Notes,
            warnings,
            provider);
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

        if (ContainsAny(text, "logo", "brand", "identity", "nhận diện", "nhan dien", "thương hiệu", "thuong hieu"))
        {
            return "Logo & Brand Identity";
        }

        if (ContainsAny(text, "social", "facebook", "instagram", "tiktok", "post", "banner", "ads", "quảng cáo", "quang cao"))
        {
            return "Social Media Design";
        }

        if (ContainsAny(text, "packaging", "package", "label", "box", "bao bì", "bao bi", "nhãn", "nhan san pham"))
        {
            return "Packaging Design";
        }

        if (ContainsAny(text, "website", "app", "mobile", "ui", "ux", "landing page", "dashboard", "giao diện", "giao dien"))
        {
            return "UI/UX Design";
        }

        if (ContainsAny(text, "poster", "flyer", "brochure", "menu", "print", "in ấn", "in an", "tờ rơi", "to roi"))
        {
            return "Print Design";
        }

        if (ContainsAny(text, "illustration", "icon", "mascot", "character", "minh họa", "minh hoa", "linh vật", "linh vat"))
        {
            return "Illustration";
        }

        return "Logo & Brand Identity";
    }

    private static bool ContainsAny(string text, params string[] keywords)
    {
        return keywords.Any(keyword => text.Contains(keyword, StringComparison.OrdinalIgnoreCase));
    }

    private static string BuildTitle(
        string rawIdea,
        string businessField,
        string categoryHint)
    {
        var prefix = categoryHint switch
        {
            "Logo & Brand Identity" => "Thiết kế nhận diện thương hiệu",
            "Social Media Design" => "Thiết kế bộ visual social media",
            "Packaging Design" => "Thiết kế bao bì sản phẩm",
            "UI/UX Design" => "Thiết kế UI/UX",
            "Print Design" => "Thiết kế ấn phẩm truyền thông",
            "Illustration" => "Thiết kế minh họa",
            _ => "Dự án thiết kế"
        };

        var normalizedBusiness = businessField == "doanh nghiệp SME" ? ExtractShortIdea(rawIdea) : businessField;
        return $"{prefix} cho {normalizedBusiness}";
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
                "01 logo chính và 02 phương án biến thể",
                "03 biến thể màu dùng trên nền sáng, nền tối và đơn sắc",
                "Bảng màu, font chữ đề xuất và ghi chú sử dụng cơ bản",
                "File PNG/JPG/PDF preview và file nguồn có thể chỉnh sửa nếu SME yêu cầu"
            ],
            "Social Media Design" =>
            [
                "01 key visual chính cho chiến dịch",
                "03 mẫu bài đăng social có thể tái sử dụng",
                "01 mẫu banner hoặc cover phù hợp kênh SME chọn",
                "File PNG/JPG export đúng kích thước và file nguồn có thể chỉnh sửa"
            ],
            "Packaging Design" =>
            [
                "01 thiết kế mặt trước bao bì hoặc nhãn sản phẩm",
                "01 layout mặt sau/mặt hông với vùng thông tin sản phẩm",
                "01 file PDF preview để SME duyệt nội dung",
                "File in ấn hoặc file nguồn theo định dạng đã thống nhất"
            ],
            "UI/UX Design" =>
            [
                "Sơ đồ luồng người dùng chính",
                "Wireframe hoặc layout low-fidelity cho màn hình trọng tâm",
                "Thiết kế high-fidelity cho các màn hình chính",
                "Ghi chú UI style: màu sắc, font, spacing và component chính"
            ],
            "Print Design" =>
            [
                "01 concept bố cục ấn phẩm",
                "01 bản thiết kế hoàn chỉnh sẵn sàng duyệt",
                "File PDF in ấn và ảnh preview JPG/PNG",
                "File nguồn có thể chỉnh sửa nếu SME yêu cầu"
            ],
            _ =>
            [
                "01 concept hình ảnh ban đầu",
                "01 bản thiết kế final sau khi SME duyệt hướng",
                "File PNG/JPG/PDF export theo nhu cầu sử dụng",
                "File nguồn hoặc ghi chú bàn giao theo thỏa thuận"
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
                ["Cần bổ sung hạn hoàn tất dự án để hệ thống gợi ý hạn Sketch và Final chính xác hơn."]);
        }

        var now = DateTimeOffset.UtcNow;
        var totalDays = Math.Max(1, (totalDeadline.Value - now).TotalDays);
        var sketchDeadline = now.AddDays(Math.Max(2, Math.Floor(totalDays * 0.35)));
        var finalDeadline = now.AddDays(Math.Max(3, Math.Floor(totalDays * 0.8)));

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
            "Hạn Sketch dùng để SME duyệt hướng thiết kế trước khi Student làm bản Final.",
            "Hạn Final nên sớm hơn hạn hoàn tất review để SME còn thời gian duyệt hoặc yêu cầu chỉnh sửa."
        };

        if (totalDays < 7)
        {
            notes.Add("Timeline đang khá gấp; SME nên giảm số lượng deliverable hoặc xác nhận năng lực Student trước khi publish.");
        }

        return new DeadlinePlan(sketchDeadline, finalDeadline, notes);
    }

    private static IReadOnlyList<string> BuildWarnings(
        AiProjectBriefAssistantRequest request,
        string? fallbackReason)
    {
        var warnings = new List<string>();

        if (!string.IsNullOrWhiteSpace(fallbackReason))
        {
            warnings.Add(fallbackReason);
        }

        if (string.IsNullOrWhiteSpace(request.BusinessField))
        {
            warnings.Add("Chưa có lĩnh vực kinh doanh; SME nên bổ sung để brief bám đúng ngành hơn.");
        }

        if (string.IsNullOrWhiteSpace(request.TargetAudience))
        {
            warnings.Add("Chưa có khách hàng mục tiêu; SME nên bổ sung trước khi publish để Student định hướng thiết kế tốt hơn.");
        }

        if (!request.BudgetAmount.HasValue)
        {
            warnings.Add("Chưa có ngân sách; hệ thống vẫn cần ngân sách hợp lệ khi lưu hoặc publish dự án.");
        }

        if (!request.TotalDeadline.HasValue)
        {
            warnings.Add("Chưa có hạn hoàn tất dự án; gợi ý deadline hiện còn hạn chế.");
        }

        return warnings;
    }

    private sealed record DeadlinePlan(
        DateTimeOffset? SketchDeadline,
        DateTimeOffset? FinalDeadline,
        IReadOnlyList<string> Notes);
}
