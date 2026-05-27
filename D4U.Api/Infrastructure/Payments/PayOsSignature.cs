namespace D4U.Api.Infrastructure.Payments;

using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using D4U.Api.Application.Features.Payments;

public static class PayOsSignature
{
    public static string CreatePaymentRequestSignature(
        decimal amount,
        string cancelUrl,
        string description,
        long orderCode,
        string returnUrl,
        string checksumKey)
    {
        var data = string.Join(
            '&',
            $"amount={FormatDecimal(amount)}",
            $"cancelUrl={cancelUrl}",
            $"description={description}",
            $"orderCode={orderCode}",
            $"returnUrl={returnUrl}");

        return ComputeHmacSha256(data, checksumKey);
    }

    public static bool IsValidWebhook(
        PayOsWebhookRequest request,
        string checksumKey)
    {
        if (request.Data is null || string.IsNullOrWhiteSpace(request.Signature))
        {
            return false;
        }

        var values = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["accountNumber"] = request.Data.AccountNumber ?? string.Empty,
            ["amount"] = FormatDecimal(request.Data.Amount),
            ["code"] = request.Data.Code ?? string.Empty,
            ["counterAccountBankId"] = request.Data.CounterAccountBankId ?? string.Empty,
            ["counterAccountBankName"] = request.Data.CounterAccountBankName ?? string.Empty,
            ["counterAccountName"] = request.Data.CounterAccountName ?? string.Empty,
            ["counterAccountNumber"] = request.Data.CounterAccountNumber ?? string.Empty,
            ["currency"] = request.Data.Currency ?? string.Empty,
            ["desc"] = request.Data.Desc ?? string.Empty,
            ["description"] = request.Data.Description,
            ["orderCode"] = request.Data.OrderCode.ToString(CultureInfo.InvariantCulture),
            ["paymentLinkId"] = request.Data.PaymentLinkId ?? string.Empty,
            ["reference"] = request.Data.Reference ?? string.Empty,
            ["transactionDateTime"] = request.Data.TransactionDateTime ?? string.Empty,
            ["virtualAccountName"] = request.Data.VirtualAccountName ?? string.Empty,
            ["virtualAccountNumber"] = request.Data.VirtualAccountNumber ?? string.Empty
        };

        var data = string.Join('&', values.Select(item => $"{item.Key}={item.Value}"));
        var expected = ComputeHmacSha256(data, checksumKey);

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected),
            Encoding.UTF8.GetBytes(request.Signature));
    }

    private static string ComputeHmacSha256(string data, string checksumKey)
    {
        var keyBytes = Encoding.UTF8.GetBytes(checksumKey);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new HMACSHA256(keyBytes);
        return Convert.ToHexString(hmac.ComputeHash(dataBytes)).ToLowerInvariant();
    }

    private static string FormatDecimal(decimal value)
    {
        return value.ToString("0.##", CultureInfo.InvariantCulture);
    }
}
