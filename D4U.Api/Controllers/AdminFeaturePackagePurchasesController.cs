namespace D4U.Api.Controllers;

using D4U.Api.Application.Features.FeaturePackages;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/admin/feature-package-purchases")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public sealed class AdminFeaturePackagePurchasesController(
    IFeaturePackageService featurePackageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FeaturePackagePurchaseResponse>>> ListPurchases(
        CancellationToken cancellationToken)
    {
        var response = await featurePackageService.ListAdminPurchasesAsync(cancellationToken);
        return Ok(response);
    }
}
