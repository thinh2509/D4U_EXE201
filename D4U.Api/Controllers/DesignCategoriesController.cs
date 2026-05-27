namespace D4U.Api.Controllers;

using D4U.Api.Application.Common.Data;
using D4U.Api.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/v1/design-categories")]
[Authorize]
public sealed class DesignCategoriesController(IUnitOfWork unitOfWork) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DesignCategoryResponse>>> List(CancellationToken cancellationToken)
    {
        var categories = await unitOfWork.Repository<DesignCategory>().Query()
            .Where(category => category.IsActive)
            .OrderBy(category => category.Name)
            .Select(category => new DesignCategoryResponse(
                category.Id,
                category.Name,
                category.Description))
            .ToListAsync(cancellationToken);

        return Ok(categories);
    }
}

public sealed record DesignCategoryResponse(
    Guid Id,
    string Name,
    string? Description);
