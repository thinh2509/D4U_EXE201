# PayOS Live Smoke Runbook

Tai lieu nay dung de chay smoke test thanh toan PayOS that cho luong core D4U. Khong commit Client ID, API Key hoac Checksum Key vao Git.

## 1. Dieu Kien

- Docker Desktop dang chay.
- Co PayOS channel da xac minh va bo credential live.
- Co Cloudflare account, domain va quyen tao named tunnel.
- Branch can test da build pass.

## 2. Tao Cloudflare Named Tunnel

Cai `cloudflared`, dang nhap va tao tunnel:

```powershell
cloudflared tunnel login
cloudflared tunnel create d4u-demo
cloudflared tunnel route dns d4u-demo d4u-demo.<domain>
```

Tao file `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: C:\Users\<user>\.cloudflared\<tunnel-id>.json

ingress:
  - hostname: d4u-demo.<domain>
    service: http://localhost:3000
  - service: http_status:404
```

Chay tunnel:

```powershell
cloudflared tunnel run d4u-demo
```

Frontend Nginx da proxy `/api/*` toi API container. Vi vay hostname public frontend cung la hostname webhook API.

### Quick Tunnel Tam Thoi

Neu can smoke ngay khi chua co domain, co the chay Quick Tunnel:

```powershell
cloudflared tunnel --url http://localhost:3000 --no-autoupdate
```

Lay URL `https://<random>.trycloudflare.com` trong output va dung URL do cho webhook URL. Khi smoke local tren cung may dang chay browser, giu `PAYMENT_RETURN_URL=http://localhost:3000/payment/success` va `PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel` de browser quay ve dung origin dang luu session SME. Quick Tunnel khong co uptime guarantee va URL se thay doi sau khi restart; chi dung cho smoke test tam thoi.

## 3. Cau Hinh `.env`

```env
PAYMENT_PROVIDER=PayOS
PAYMENT_RETURN_URL=https://d4u-demo.<domain>/payment/success
PAYMENT_CANCEL_URL=https://d4u-demo.<domain>/payment/cancel
PAYMENT_PAYOS_CLIENT_ID=<live-client-id>
PAYMENT_PAYOS_API_KEY=<live-api-key>
PAYMENT_PAYOS_CHECKSUM_KEY=<live-checksum-key>
```

Khoi dong lai stack:

```powershell
docker compose up -d --build
docker compose ps
```

Kiem tra public URL:

```text
https://d4u-demo.<domain>
https://d4u-demo.<domain>/health
https://d4u-demo.<domain>/api/v1/payments/payos/webhook
```

Webhook URL chuan:

```text
https://d4u-demo.<domain>/api/v1/payments/payos/webhook
```

## 4. Confirm Webhook Voi PayOS

Chi chay tren may da set credential vao environment. Khong paste credential vao log, ticket hoac screenshot.

```powershell
$headers = @{
  "x-client-id" = $env:PAYMENT_PAYOS_CLIENT_ID
  "x-api-key" = $env:PAYMENT_PAYOS_API_KEY
}
$body = @{
  webhookUrl = "https://d4u-demo.<domain>/api/v1/payments/payos/webhook"
} | ConvertTo-Json
Invoke-RestMethod `
  -Method Post `
  -Uri "https://api-merchant.payos.vn/confirm-webhook" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

Ky vong PayOS tra HTTP 2xx. API D4U chi cap nhat payment khi webhook co signature hop le.

## 5. Live Smoke Gia Tri Nho

1. SME publish project co budget nho hop le.
2. Student apply.
3. SME tao offer; Student accept.
4. SME vao workspace va mo PayOS checkout.
5. Chuyen khoan that theo QR.
6. PayOS return page poll backend moi 2 giay, toi da 60 giay.
7. Webhook hop le cap nhat payment `SUCCESS`, escrow `FUNDED`, project `IN_PROGRESS`.
8. Student upload va nop Sketch; SME approve.
9. Student upload va nop Final; SME approve.
10. Worker release escrow idempotent: escrow `RELEASED`, co mot disbursement va mot wallet transaction `DISBURSEMENT_CREDIT`.

Gui lai webhook hoac retry release khong duoc credit vi lan hai.

## 6. SQL Check

```sql
select id, status, provider, paid_at from payments order by created_at desc limit 5;
select id, project_id, status, funded_at, released_at from escrows order by created_at desc limit 5;
select escrow_id, gross_amount, platform_fee_amount, net_amount, status from disbursements order by created_at desc limit 5;
select user_id, available_balance, locked_balance, status from wallets order by created_at desc limit 5;
select type, amount, balance_after, reference_type, reference_id from wallet_transactions order by created_at desc limit 10;
```

## 7. Tai Lieu PayOS Chinh Thuc

- [payOS API](https://payos.vn/docs/api/)
- [Webhook payOS](https://payos.vn/docs/du-lieu-tra-ve/webhook/)
- [Tao kenh thanh toan](https://payos.vn/docs/huong-dan-su-dung/tao-kenh-thanh-toan)
