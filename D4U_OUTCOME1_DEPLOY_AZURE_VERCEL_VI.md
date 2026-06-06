# D4U Outcome 1 Deploy Runbook: Azure + Vercel

Runbook này dùng cho môi trường demo public của Outcome 1. Backend chạy trên Azure App Service F1, database dùng Azure PostgreSQL Flexible Server, frontend chạy trên Vercel. Không commit secret thật vào repo.

## 1. Kiến trúc Deploy

- Backend: Azure App Service, runtime .NET 8, publish project `D4U.Api`.
- Database: Azure PostgreSQL Flexible Server, database `d4u_mvp`.
- Frontend: Vercel, root directory `FE`, build command `npm run build`, output `dist`.
- Payment: PayOS callback về Vercel, webhook về Azure API.
- Seed demo: chỉ seed Admin từ App Service settings. SME và Student đăng ký thật trên frontend.
- Uploads: dùng App Service local persistent path `/home/site/uploads` cho Outcome 1 demo. Nếu cần scale-out hoặc lưu lâu dài, chuyển sang Azure Blob Storage ở phase hardening.

## 2. Chuẩn Bị Azure PostgreSQL

1. Tạo Azure PostgreSQL Flexible Server.
2. Chọn Burstable tier phù hợp credit sinh viên.
3. Tạo database `d4u_mvp`.
4. Bật firewall cho Azure services và IP máy deploy nếu cần kết nối trực tiếp.
5. Lấy connection string Npgsql, ví dụ:

```text
Host=<server>.postgres.database.azure.com;Port=5432;Database=d4u_mvp;Username=<user>;Password=<password>;Ssl Mode=Require;Trust Server Certificate=true
```

## 3. Deploy Backend Lên Azure App Service

1. Tạo App Service:
   - Runtime stack: `.NET 8`
   - OS: Linux hoặc Windows đều được; ưu tiên Linux nếu dùng publish từ GitHub Actions.
   - Plan: F1 cho demo nhẹ.
2. Cấu hình deployment source trỏ vào repo.
3. Nếu dùng GitHub Actions, workflow publish project `D4U.Api/D4U.Api.csproj`.
4. App Service settings bắt buộc:

```text
ASPNETCORE_ENVIRONMENT=Production
D4U_APPLY_MIGRATIONS=true
D4U_DATABASE_CONNECTION=<azure-postgres-connection-string>

Jwt__Issuer=https://<azure-app-service-domain>
Jwt__Audience=d4u-client
Jwt__SigningKey=<strong-secret-at-least-32-characters>

Admin__Email=<admin-email>
Admin__Username=admin
Admin__Password=<strong-admin-password>
Admin__FullName=D4U Admin

Ai__Provider=OpenAI
Ai__ApiKey=<openai-api-key>
Ai__Model=gpt-5-mini
Ai__TimeoutSeconds=30
Ai__FallbackToMock=true
Ai__BaseUrl=https://api.openai.com/v1

Payment__Provider=PayOS
Payment__ReturnUrl=https://<vercel-domain>/payment/success
Payment__CancelUrl=https://<vercel-domain>/payment/cancel
Payment__PayOS__ClientId=<payos-client-id>
Payment__PayOS__ApiKey=<payos-api-key>
Payment__PayOS__ChecksumKey=<payos-checksum-key>
Payment__PayOS__BaseUrl=https://api-merchant.payos.vn

GoogleAuth__ClientId=<google-client-id>

Cors__AllowedOrigins__0=https://<vercel-domain>
Uploads__RootPath=/home/site/uploads
```

AI Brief dùng OpenAI khi có API key. Nếu OpenAI lỗi hoặc hết quota, `Ai__FallbackToMock=true` giúp hệ thống trả fallback tiếng Việt có cấu trúc thay vì chặn SME.

5. Nếu bật email verification thật, thêm SMTP settings:

```text
Email__SmtpHost=<smtp-host>
Email__SmtpPort=587
Email__Username=<smtp-username>
Email__Password=<smtp-password>
Email__FromEmail=<from-email>
Email__FromName=D4U
Email__UseSsl=true
```

6. Không bật demo seed trên môi trường này. Không cấu hình `DemoSeed__Enabled=true`.
7. Restart App Service sau khi set env.
8. Kiểm tra health:

```text
https://<azure-app-service-domain>/health
```

Kết quả mong đợi:

```json
{"status":"ok"}
```

## 4. Deploy Frontend Lên Vercel

1. Import repo vào Vercel.
2. Project settings:
   - Root Directory: `FE`
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Environment variables:

```text
VITE_API_BASE_URL=https://<azure-app-service-domain>/api/v1
VITE_GOOGLE_CLIENT_ID=<google-client-id>
```

4. Deploy Vercel.
5. Nếu dùng Google login, vào Google Cloud Console và thêm Vercel domain vào Authorized JavaScript origins:

```text
https://<vercel-domain>
```

## 5. Cấu Hình PayOS

Trong PayOS dashboard, dùng URL public:

```text
Return URL:  https://<vercel-domain>/payment/success
Cancel URL:  https://<vercel-domain>/payment/cancel
Webhook URL: https://<azure-app-service-domain>/api/v1/payments/payos/webhook
```

Sau khi cấu hình, tạo một payment thật hoặc sandbox/live smoke theo tài khoản PayOS hiện có để xác nhận webhook đến Azure API.

## 6. Smoke Test Outcome 1

1. Mở `https://<vercel-domain>`.
2. Login Admin bằng tài khoản seed từ App Service settings.
3. Đăng ký SME mới và hoàn tất hồ sơ.
4. Đăng ký Student mới, hoàn tất hồ sơ và verification theo flow hiện tại.
5. SME tạo và publish project.
6. Student apply hoặc nhận offer.
7. SME tạo offer, Student accept, SME thanh toán PayOS.
8. Xác nhận webhook cập nhật escrow funded.
9. Student nộp Sketch, SME review.
10. Student nộp Final, SME approve Final.
11. Kiểm tra escrow release, ví Student tăng đúng net amount.
12. Student tạo withdrawal request.
13. Admin xử lý withdrawal.
14. Kiểm tra notification và rating sau completion.

## 7. Checklist Trước Demo

- Azure App Service health OK.
- Vercel frontend load OK.
- Frontend gọi Azure API không bị CORS.
- Admin seed only; không có SME/Student demo nếu chưa đăng ký.
- PayOS return/cancel/webhook đều dùng HTTPS public URL.
- Upload/download file verification và submission hoạt động.
- Outcome 1 core flow chạy hết không có lỗi blocking.
- Ghi lại domain, thời điểm deploy, commit hash, và người chịu trách nhiệm vận hành demo.

## 8. Lưu Ý Vận Hành

- F1 phù hợp demo nhẹ, không phù hợp tải production.
- App Service local storage phù hợp demo một instance. Không dùng scale-out khi còn lưu file local.
- Không reset database demo nếu chưa backup hoặc chưa được xác nhận.
- Nếu cần dữ liệu sạch, reset database rồi restart App Service để migration và Admin seed chạy lại.
- Với môi trường lâu dài, ưu tiên chuyển uploads sang Azure Blob Storage và cấu hình backup PostgreSQL.
