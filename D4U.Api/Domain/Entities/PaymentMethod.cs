namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class PaymentMethod
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string MethodType { get; set; } = "BANK_ACCOUNT";
    public string? BankName { get; set; }
    public string? BankCode { get; set; }
    public string? AccountHolderName { get; set; }
    public string? MaskedAccountNumber { get; set; }
    public string? AccountNumberEncrypted { get; set; }
    public string? ProviderToken { get; set; }
    public bool IsDefault { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTimeOffset CreatedAt { get; set; }
}

