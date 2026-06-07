# D4U Outcome 1 Deploy Runbook: Azure + Vercel

Runbook nay huong dan deploy moi truong demo public cho D4U Outcome 1 voi backend tren Azure App Service, database tren Azure PostgreSQL Flexible Server, va frontend tren Vercel. Tai lieu nay duoc viet theo dung codebase hien tai: backend ho tro CORS tu env, migration tu env, PayOS, Google auth, OpenAI AI Brief, va frontend dung `VITE_API_BASE_URL`.

Luu y:
- Khong commit secret that vao repo.
- Moi truong nay chi dung cho demo Outcome 1, khong phai production.
- Chi seed `Admin`; SME va Student dang ky that tren frontend.

## 1. Kien truc va ket qua mong doi

Thanh phan deploy:
- Backend: Azure App Service, runtime .NET 8, publish project `D4U.Api`.
- Database: Azure PostgreSQL Flexible Server, database `d4u_mvp`.
- Frontend: Vercel, root directory `FE`, build `npm run build`, output `dist`.
- Payment: PayOS return/cancel ve frontend Vercel, webhook ve backend Azure.
- Uploads: luu o `/home/site/uploads` tren App Service cho demo 1 instance.

Ket qua sau deploy:
- Frontend public load duoc qua HTTPS.
- Frontend goi backend Azure qua `VITE_API_BASE_URL`, khong con dung `/api/v1` local.
- `/health` cua backend tra `{"status":"ok"}`.
- Admin login duoc bang tai khoan seed.
- Core flow Outcome 1 chay duoc: register, verify, project, offer, PayOS, workspace, wallet, withdrawal.

## 2. Chuan bi truoc khi vao cloud

Tai khoan va quyen truy cap can co:
- GitHub repo access de Azure/Vercel lay source.
- Azure student credit hoac Azure subscription.
- Vercel account.
- PayOS dashboard.
- Google Cloud Console neu bat Google login.
- OpenAI API key neu dung AI Brief that.
- SMTP credentials neu bat email verification that.

Gia tri can chot truoc:
- `resourceGroupName`: ten resource group Azure, vi du `rg-d4u-demo`.
- `location`: khu vuc, vi du `Southeast Asia` hoac khu vuc gan nhat ma credit ho tro.
- `postgresServerName`: vi du `d4u-demo-pg`.
- `appServicePlanName`: vi du `asp-d4u-demo`.
- `webAppName`: vi du `d4u-outcome1-api`.
- `vercelDomain`: domain Vercel du kien.
- `azureApiUrl`: `https://<web-app-name>.azurewebsites.net`
- `Jwt__Issuer`: dung chinh `azureApiUrl`
- `Jwt__Audience`: `d4u-client`
- `Jwt__SigningKey`: chuoi bi mat manh, toi thieu 32 ky tu.
- `Admin__Email`, `Admin__Username`, `Admin__Password`, `Admin__FullName`
- `databaseName`: `d4u_mvp`
- `databaseAdminUser`, `databaseAdminPassword`
- `Payment__PayOS__ClientId`, `Payment__PayOS__ApiKey`, `Payment__PayOS__ChecksumKey`
- `GoogleAuth__ClientId`
- `Ai__ApiKey`

Gia tri demo recommended:
- `ASPNETCORE_ENVIRONMENT=Production`
- `D4U_APPLY_MIGRATIONS=true`
- `Ai__Provider=OpenAI`
- `Ai__Model=gpt-5-mini`
- `Ai__TimeoutSeconds=30`
- `Ai__FallbackToMock=true`
- `Uploads__RootPath=/home/site/uploads`

## 3. Tao Azure PostgreSQL Flexible Server

1. Dang nhap Azure Portal.
2. Tao `Resource Group` moi.
   Expected result:
   Resource group moi duoc tao, chua co resource ben trong.
3. Tao `Azure Database for PostgreSQL flexible server`.
4. Chon:
   - Workload type: development/demo.
   - Compute tier: `Burstable`.
   - Version: phu hop mac dinh PostgreSQL 16 hoac version Azure ho tro on dinh.
   - Server name: dung gia tri da chot.
   - Admin username/password: dung gia tri da chot.
5. Sau khi server tao xong, tao database `d4u_mvp`.
6. Mo networking/firewall:
   - Bat "Allow Azure services and resources to access this server".
   - Neu can ket noi truc tiep tu may local, add client IP.
7. Lay connection string theo format Npgsql:

```text
Host=<server>.postgres.database.azure.com;Port=5432;Database=d4u_mvp;Username=<user>;Password=<password>;Ssl Mode=Require;Trust Server Certificate=true
```

Expected result:
- Server PostgreSQL da live.
- Database `d4u_mvp` ton tai.
- Connection string ket noi duoc va bat buoc SSL.

## 4. Tao Azure App Service cho backend

1. Tao `App Service Plan`.
   - Pricing tier: `F1` cho demo nhe.
2. Tao `Web App`.
   - Publish: Code.
   - Runtime stack: `.NET 8`.
   - Operating System: uu tien Linux.
   - Region: cung region voi PostgreSQL neu co the.
3. Ghi lai domain backend:

```text
https://<web-app-name>.azurewebsites.net
```

4. Vao `Configuration > Application settings` va set toan bo bien moi truong sau.

### Database

```text
ASPNETCORE_ENVIRONMENT=Production
D4U_APPLY_MIGRATIONS=true
D4U_DATABASE_CONNECTION=<azure-postgres-connection-string>
Uploads__RootPath=/home/site/uploads
```

### JWT

```text
Jwt__Issuer=https://<web-app-name>.azurewebsites.net
Jwt__Audience=d4u-client
Jwt__SigningKey=<strong-secret-at-least-32-characters>
```

### Admin seed

```text
Admin__Email=<admin-email>
Admin__Username=admin
Admin__Password=<strong-admin-password>
Admin__FullName=D4U Admin
```

### AI Brief

```text
Ai__Provider=OpenAI
Ai__ApiKey=<openai-api-key>
Ai__Model=gpt-5-mini
Ai__TimeoutSeconds=30
Ai__FallbackToMock=true
Ai__BaseUrl=https://api.openai.com/v1
```

Ghi chu:
- Neu `Ai__ApiKey` sai hoac het quota, he thong van co the fallback mock neu `Ai__FallbackToMock=true`.

### PayOS

```text
Payment__Provider=PayOS
Payment__ReturnUrl=https://<vercel-domain>/payment/success
Payment__CancelUrl=https://<vercel-domain>/payment/cancel
Payment__PayOS__ClientId=<payos-client-id>
Payment__PayOS__ApiKey=<payos-api-key>
Payment__PayOS__ChecksumKey=<payos-checksum-key>
Payment__PayOS__BaseUrl=https://api-merchant.payos.vn
```

### Google login

```text
GoogleAuth__ClientId=<google-client-id>
```

### Email verification that

```text
Email__SmtpHost=<smtp-host>
Email__SmtpPort=587
Email__Username=<smtp-username>
Email__Password=<smtp-password>
Email__FromEmail=<from-email>
Email__FromName=D4U
Email__UseSsl=true
```

Neu chua can email that, co the de trong nhom nay.

### CORS

```text
Cors__AllowedOrigins__0=https://<vercel-domain>
```

5. Khong bat demo seed:
   - Khong set `DemoSeed__Enabled=true`.
6. Save settings va restart Web App.

Expected result:
- App Service restart thanh cong.
- App startup khong loi migration.
- Health check tra ket qua:

```text
https://<web-app-name>.azurewebsites.net/health
```

Expected response:

```json
{"status":"ok"}
```

## 5. Chon cach deploy backend

Mac dinh dung GitHub Actions de deploy lap lai duoc.

### Cach khuyen nghi: GitHub Actions + Publish Profile

1. Trong Azure App Service, vao `Overview > Get publish profile`.
2. Download file publish profile.
3. Trong GitHub repo, vao `Settings > Secrets and variables > Actions`.
4. Tao secret:

```text
AZURE_WEBAPP_PUBLISH_PROFILE=<noi dung file publish profile>
```

5. Tao hoac cap nhat workflow GitHub Actions de publish `D4U.Api/D4U.Api.csproj`.
6. Trigger workflow bang cach push code len branch deploy hoac chay manual workflow.

Expected result:
- Workflow build .NET 8 thanh cong.
- Azure App Service nhan ban publish moi.
- Health endpoint van tra `ok`.

### Cach thay the: Service Principal

Chi dung neu team da co chuan Azure login bang service principal.

Can co:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Neu chua co san, uu tien `publish profile` vi nhanh va don gian hon cho demo.

## 6. Deploy frontend len Vercel

1. Dang nhap Vercel.
2. Chon `Add New Project`.
3. Import GitHub repo D4U.
4. Cau hinh project:
   - Root Directory: `FE`
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Set environment variables:

```text
VITE_API_BASE_URL=https://<web-app-name>.azurewebsites.net/api/v1
VITE_GOOGLE_CLIENT_ID=<google-client-id>
```

6. Deploy project.
7. Ghi lai domain Vercel public.

Expected result:
- Frontend load qua HTTPS.
- Browser devtools khong con goi `http://localhost`.
- Mọi request API di toi `https://<web-app-name>.azurewebsites.net/api/v1`.
- Refresh token van goi `https://<web-app-name>.azurewebsites.net/api/v1/auth/refresh`.

## 7. Cau hinh Google OAuth

1. Vao Google Cloud Console.
2. Mo OAuth Client dang dung cho frontend.
3. Them domain Vercel vao `Authorized JavaScript origins`:

```text
https://<vercel-domain>
```

4. Neu co redirect URI khac trong he thong Google, giu nguyen cac gia tri da dung; task nay chi can origin cho Google One Tap / client-side login.

Expected result:
- Nut Google login hien tren frontend neu `VITE_GOOGLE_CLIENT_ID` da set.
- Login bang Google khong bi loi origin mismatch.

## 8. Cau hinh PayOS

1. Vao PayOS dashboard.
2. Set URL public:

```text
Return URL:  https://<vercel-domain>/payment/success
Cancel URL:  https://<vercel-domain>/payment/cancel
Webhook URL: https://<web-app-name>.azurewebsites.net/api/v1/payments/payos/webhook
```

3. Luu cau hinh.
4. Dam bao cac key sau da duoc set dung trong App Service:
   - `Payment__PayOS__ClientId`
   - `Payment__PayOS__ApiKey`
   - `Payment__PayOS__ChecksumKey`
   - `Payment__PayOS__BaseUrl`

Expected result:
- SME mo duoc checkout URL PayOS tu workspace/offer.
- Return URL quay ve frontend dung route.
- Webhook toi backend va cap nhat payment/escrow funded.

## 9. Thu tu deploy de an toan

1. Tao PostgreSQL.
2. Tao App Service va set env.
3. Deploy backend.
4. Kiem tra `/health`.
5. Deploy frontend len Vercel.
6. Cau hinh Google origin.
7. Cau hinh PayOS return/cancel/webhook.
8. Chay smoke test Outcome 1.

Khong dao thu tu nay trong lan deploy dau:
- Neu deploy frontend truoc khi backend/CORS san sang, UI se loi network/CORS.
- Neu deploy backend truoc khi set env database/JWT/PayOS, app co the startup fail.

## 10. Smoke test Outcome 1 step by step

1. Mo `https://<vercel-domain>`.
   Expected result:
   Landing page load nhanh, logo/CTA hien binh thuong, khong co request ve localhost.
2. Mo `https://<web-app-name>.azurewebsites.net/health`.
   Expected result:
   `{"status":"ok"}`
3. Dang nhap bang Admin seed.
   Expected result:
   Dang nhap thanh cong, vao dashboard admin.
4. Dang ky SME moi.
   Expected result:
   SME tao duoc tai khoan va hoan thien ho so.
5. Dang ky Student moi.
   Expected result:
   Student tao duoc tai khoan va hoan thien flow verification hien tai.
6. SME tao va publish project.
7. Student apply hoac SME gui offer.
8. Student accept offer.
9. SME thanh toan PayOS.
   Expected result:
   Workspace/payment page hien pending roi funded sau webhook.
10. Student nop Sketch.
11. SME review Sketch.
12. Student nop Final.
13. SME approve Final.
   Expected result:
   Escrow release, vi Student tang dung theo luat hien tai.
14. Student tao withdrawal request.
15. Admin xu ly withdrawal.
16. Kiem tra notification, rating, upload/download file.

## 11. Expected result sau tung cum buoc

Sau App Service settings + restart:
- App boot thanh cong.
- Migration tu chay neu `D4U_APPLY_MIGRATIONS=true`.
- Admin seed duoc tao.

Sau deploy Vercel:
- Frontend khong goi `/api/v1` local.
- Request auth, refresh token, upload, payment, notifications deu goi Azure API.

Sau cau hinh PayOS:
- Return/cancel route dung frontend.
- Webhook cap nhat payment thanh cong.
- Workspace SME mo duoc checkout URL.

Sau smoke test:
- Outcome 1 core flow khong co blocker.
- Domain, commit hash va thoi diem deploy duoc ghi lai cho demo team.

## 12. Troubleshooting nhanh

### 403 CORS

Nguyen nhan thuong gap:
- Chua set `Cors__AllowedOrigins__0`
- Set sai domain Vercel
- Domain co slash cuoi hoac nham preview domain/production domain

Cach kiem tra:
- Xem App Service settings
- Xac nhan frontend dang chay dung domain nao
- Restart App Service sau khi doi setting

### 401 loop hoac bi logout lien tuc

Nguyen nhan thuong gap:
- `VITE_API_BASE_URL` sai
- `Jwt__Issuer` hoac `Jwt__Audience` lech
- Frontend dang goi API cu, backend tra token khong hop issuer

Cach kiem tra:
- Browser network tab xem request login va `/auth/refresh`
- Xac nhan `VITE_API_BASE_URL=https://<azure-api>/api/v1`
- Xac nhan `Jwt__Issuer=https://<azure-api-domain>`

### 500 on startup

Nguyen nhan thuong gap:
- `D4U_DATABASE_CONNECTION` sai
- PostgreSQL firewall chua mo cho Azure services
- Migration fail khi app boot

Cach kiem tra:
- App Service Log Stream
- Connection string Npgsql co `Ssl Mode=Require`
- Database `d4u_mvp` da ton tai

### PayOS return success nhung payment chua funded

Nguyen nhan thuong gap:
- Webhook chua toi backend
- `Payment__PayOS__ChecksumKey` sai
- Webhook URL sai domain/duong dan

Cach kiem tra:
- PayOS dashboard webhook history
- Backend logs tai endpoint webhook
- Xac nhan URL: `/api/v1/payments/payos/webhook`

### Google login khong hien hoac khong dung duoc

Nguyen nhan thuong gap:
- Thieu `VITE_GOOGLE_CLIENT_ID`
- `GoogleAuth__ClientId` chua set
- Vercel domain chua duoc add vao Google Authorized JavaScript origins

### AI Brief fallback

Nguyen nhan thuong gap:
- `Ai__ApiKey` thieu hoac sai
- Het quota OpenAI
- Timeout den OpenAI

Ket qua mong doi:
- Neu `Ai__FallbackToMock=true`, SME van nhan duoc fallback tieng Viet co cau truc thay vi request bi chan hoan toan.

## 13. Checklist truoc demo

- Backend `/health` OK.
- Vercel frontend load OK.
- Frontend khong bi CORS.
- Admin seed only, khong co demo SME/Student neu chua dang ky.
- PayOS return/cancel/webhook deu la HTTPS public URL.
- Upload/download file verification va submission hoat dong.
- AI Brief hoat dong bang OpenAI hoac fallback dung chu truong.
- Outcome 1 core flow chay het khong co loi blocking.
- Da ghi lai:
  - frontend domain
  - backend domain
  - commit hash
  - thoi diem deploy
  - nguoi phu trach demo

## 14. Van hanh va redeploy

Redeploy sau khi doi code:
1. Push code len GitHub.
2. Chay lai GitHub Actions cho backend neu co thay doi API/backend.
3. Trigger redeploy Vercel neu co thay doi frontend.
4. Chay lai smoke test ngan:
   - `/health`
   - login admin
   - 1 request API tu frontend

Reset demo database co kiem soat:
1. Xac nhan voi team rang du lieu hien tai duoc phep xoa.
2. Reset database tren Azure PostgreSQL.
3. Restart App Service de migration va Admin seed chay lai.
4. Xac nhan chi con Admin seed.

Luu y van hanh:
- F1 chi hop demo nhe, khong hop production load.
- Local App Service storage chi hop demo 1 instance; khong scale-out khi con luu file local.
- Neu chay lau dai, follow-up nen dua uploads sang Azure Blob Storage va bat backup PostgreSQL.
