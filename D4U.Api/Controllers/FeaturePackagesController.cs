namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.FeaturePackages;
using D4U.Api.Application.Features.Payments;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1")]
[Authorize]
public sealed class FeaturePackagesController(
    IFeaturePackageService featurePackageService,
    IFeatureEntitlementService featureEntitlementService,
    IPaymentService paymentService) : ControllerBase
{
    [HttpGet("feature-packages")]
    public async Task<ActionResult<IReadOnlyList<FeaturePackageResponse>>> ListPackages(
        [FromQuery] FeaturePackageRole? role,
        CancellationToken cancellationToken)
    {
        var response = await featurePackageService.ListPackagesAsync(
            GetRequiredUserId(),
            role,
            cancellationToken);
        return Ok(response);
    }

    [HttpPost("feature-package-purchases")]
    [Authorize(Roles = nameof(UserRole.SME) + "," + nameof(UserRole.STUDENT))]
    public async Task<ActionResult<FeaturePackagePurchaseResponse>> CreatePurchase(
        CreateFeaturePackagePurchaseRequest request,
        CancellationToken cancellationToken)
    {
        var response = await featurePackageService.CreatePurchaseAsync(
            GetRequiredUserId(),
            request,
            cancellationToken);
        return Ok(response);
    }

    [HttpGet("feature-package-purchases/me")]
    [Authorize(Roles = nameof(UserRole.SME) + "," + nameof(UserRole.STUDENT))]
    public async Task<ActionResult<IReadOnlyList<FeaturePackagePurchaseResponse>>> ListMyPurchases(
        CancellationToken cancellationToken)
    {
        var response = await featurePackageService.ListMyPurchasesAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpPost("feature-package-purchases/{purchaseId:guid}/payment")]
    [Authorize(Roles = nameof(UserRole.SME) + "," + nameof(UserRole.STUDENT))]
    public async Task<ActionResult<FeaturePackagePaymentResponse>> CreatePurchasePayment(
        Guid purchaseId,
        CancellationToken cancellationToken)
    {
        var response = await paymentService.CreateFeaturePackagePaymentAsync(
            GetRequiredUserId(),
            purchaseId,
            cancellationToken);
        return Ok(response);
    }

    [HttpGet("me/feature-entitlements")]
    [Authorize(Roles = nameof(UserRole.SME) + "," + nameof(UserRole.STUDENT))]
    public async Task<ActionResult<IReadOnlyList<UserFeatureEntitlementResponse>>> ListMyEntitlements(
        CancellationToken cancellationToken)
    {
        var response = await featureEntitlementService.ListMyEntitlementsAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    private Guid GetRequiredUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(value, out var userId))
        {
            throw new UnauthorizedAccessException("User id claim is missing.");
        }

        return userId;
    }
}
