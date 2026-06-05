namespace D4U.Api.Infrastructure.Persistence.Migrations;

using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

[DbContext(typeof(D4UDbContext))]
[Migration("20260606090000_NormalizeNotificationCopy")]
public partial class NormalizeNotificationCopy : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE public.notifications AS notification
            SET title = 'Yêu cầu rút tiền đã hoàn tất',
                body = 'D4U đã xác nhận chuyển '
                    || to_char(withdrawal.net_amount, 'FM999,999,999,990')
                    || ' VND. Mã giao dịch: '
                    || COALESCE(NULLIF(withdrawal.bank_transaction_reference, ''), 'Không có')
                    || '.'
            FROM public.withdrawal_requests AS withdrawal
            WHERE notification.type = 'WITHDRAWAL_COMPLETED'
              AND notification.reference_type = 'WithdrawalRequest'
              AND notification.reference_id = withdrawal.id;

            UPDATE public.notifications AS notification
            SET title = 'Yêu cầu rút tiền chưa thành công',
                body = 'Số tiền '
                    || to_char(withdrawal.amount, 'FM999,999,999,990')
                    || ' VND đã được trả lại số dư khả dụng. Lý do: '
                    || COALESCE(NULLIF(withdrawal.failure_reason, ''), 'Không có thông tin')
            FROM public.withdrawal_requests AS withdrawal
            WHERE notification.type = 'WITHDRAWAL_FAILED'
              AND notification.reference_type = 'WithdrawalRequest'
              AND notification.reference_id = withdrawal.id;

            UPDATE public.notifications AS notification
            SET title = 'Tiền dự án đã được cộng vào ví',
                body = 'Bạn đã nhận '
                    || to_char(disbursement.net_amount, 'FM999,999,999,990')
                    || ' VND sau khi trừ '
                    || to_char(disbursement.platform_fee_amount, 'FM999,999,999,990')
                    || ' VND phí nền tảng.'
            FROM public.disbursements AS disbursement
            WHERE notification.type = 'ESCROW_RELEASED'
              AND notification.reference_type = 'Disbursement'
              AND notification.reference_id = disbursement.id;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
