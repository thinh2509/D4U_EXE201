namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthUserResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.RegisterAsync(request, cancellationToken);
        return CreatedAtAction(nameof(Me), new { }, response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.LoginAsync(
            request,
            Request.Headers.UserAgent.ToString(),
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Google(
        GoogleLoginRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.LoginWithGoogleAsync(
            request,
            Request.Headers.UserAgent.ToString(),
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh(
        RefreshTokenRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.RefreshAsync(
            request,
            Request.Headers.UserAgent.ToString(),
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(
        LogoutRequest request,
        CancellationToken cancellationToken)
    {
        await authService.LogoutAsync(request, cancellationToken);
        return NoContent();
    }

    [HttpPost("email-verification/request")]
    [AllowAnonymous]
    public async Task<ActionResult<UserEmailVerificationResponse>> RequestEmailVerification(
        RequestUserEmailVerificationRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.RequestEmailVerificationAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("email-verification/confirm")]
    [AllowAnonymous]
    public async Task<ActionResult<UserEmailVerificationResponse>> ConfirmEmailVerification(
        ConfirmUserEmailVerificationRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.ConfirmEmailVerificationAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthUserResponse>> Me(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var response = await authService.GetCurrentUserAsync(userId, cancellationToken);
        return Ok(response);
    }
}
