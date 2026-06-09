namespace D4U.Api.Application.Features.Auth;

using D4U.Api.Domain.Enums;
using FluentValidation;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(request => request.Email)
            .NotEmpty()
            .WithMessage("Vui lòng nhập email.")
            .EmailAddress()
            .WithMessage("Email không hợp lệ.")
            .MaximumLength(255)
            .WithMessage("Email không được vượt quá 255 ký tự.");

        RuleFor(request => request.Username)
            .NotEmpty()
            .WithMessage("Vui lòng nhập username.")
            .MinimumLength(3)
            .WithMessage("Username cần ít nhất 3 ký tự.")
            .MaximumLength(100)
            .WithMessage("Username không được vượt quá 100 ký tự.")
            .Matches("^[a-zA-Z0-9._-]+$")
            .WithMessage("Username chỉ được chứa chữ, số, dấu chấm, gạch dưới và gạch ngang.");

        RuleFor(request => request.Password)
            .NotEmpty()
            .WithMessage("Vui lòng nhập mật khẩu.")
            .MinimumLength(8)
            .WithMessage("Mật khẩu cần ít nhất 8 ký tự.")
            .MaximumLength(128)
            .WithMessage("Mật khẩu không được vượt quá 128 ký tự.")
            .Matches("[A-Za-z]")
            .WithMessage("Mật khẩu phải có ít nhất một chữ cái.")
            .Matches("[0-9]")
            .WithMessage("Mật khẩu phải có ít nhất một chữ số.");

        RuleFor(request => request.FullName)
            .NotEmpty()
            .WithMessage("Vui lòng nhập họ và tên.")
            .MaximumLength(255)
            .WithMessage("Họ và tên không được vượt quá 255 ký tự.");

        RuleFor(request => request.Role)
            .Must(role => role is UserRole.STUDENT or UserRole.SME)
            .WithMessage("Vai trò đăng ký không hợp lệ.");
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
