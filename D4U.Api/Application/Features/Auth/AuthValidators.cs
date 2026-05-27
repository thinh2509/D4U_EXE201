namespace D4U.Api.Application.Features.Auth;

using D4U.Api.Domain.Enums;
using FluentValidation;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(request => request.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(255);

        RuleFor(request => request.Username)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(100)
            .Matches("^[a-zA-Z0-9._-]+$")
            .WithMessage("Username can only contain letters, numbers, dots, underscores, and hyphens.");

        RuleFor(request => request.Password)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128)
            .Matches("[A-Za-z]")
            .WithMessage("Password must contain at least one letter.")
            .Matches("[0-9]")
            .WithMessage("Password must contain at least one number.");

        RuleFor(request => request.FullName)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(request => request.Role)
            .Must(role => role is UserRole.STUDENT or UserRole.SME)
            .WithMessage("Only STUDENT and SME accounts can self-register.");
    }
}

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(request => request.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(255);

        RuleFor(request => request.Password)
            .NotEmpty()
            .MaximumLength(128);
    }
}

public sealed class GoogleLoginRequestValidator : AbstractValidator<GoogleLoginRequest>
{
    public GoogleLoginRequestValidator()
    {
        RuleFor(request => request.IdToken)
            .NotEmpty()
            .MaximumLength(10000);

        RuleFor(request => request.Role)
            .Must(role => role is UserRole.STUDENT or UserRole.SME)
            .WithMessage("Google login only supports STUDENT and SME self-registration.");
    }
}

public sealed class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(request => request.RefreshToken)
            .NotEmpty()
            .MaximumLength(512);
    }
}

public sealed class LogoutRequestValidator : AbstractValidator<LogoutRequest>
{
    public LogoutRequestValidator()
    {
        RuleFor(request => request.RefreshToken)
            .NotEmpty()
            .MaximumLength(512);
    }
}

public sealed class RequestUserEmailVerificationRequestValidator : AbstractValidator<RequestUserEmailVerificationRequest>
{
    public RequestUserEmailVerificationRequestValidator()
    {
        RuleFor(request => request.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(255);
    }
}

public sealed class ConfirmUserEmailVerificationRequestValidator : AbstractValidator<ConfirmUserEmailVerificationRequest>
{
    public ConfirmUserEmailVerificationRequestValidator()
    {
        RuleFor(request => request.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(255);

        RuleFor(request => request.Code)
            .NotEmpty()
            .Length(4, 12);
    }
}
