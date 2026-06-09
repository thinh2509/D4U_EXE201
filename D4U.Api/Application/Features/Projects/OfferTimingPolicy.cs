namespace D4U.Api.Application.Features.Projects;

public static class OfferTimingPolicy
{
    public static readonly TimeSpan StudentDecisionWindow = TimeSpan.FromHours(24);
    public static readonly TimeSpan SmePaymentWindow = TimeSpan.FromHours(24);
    public static readonly TimeSpan MinimumSketchLeadTime = StudentDecisionWindow + SmePaymentWindow;

    public const string SketchDeadlineTooCloseMessage =
        "Sketch deadline quá gần. Cần ít nhất 2 ngày để Student xác nhận offer và SME hoàn tất thanh toán.";
}
