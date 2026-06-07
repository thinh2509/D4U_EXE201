# D4U Core Interaction E2E Test Guide

TÃ i liá»‡u nÃ y kiá»ƒm thá»­ luá»“ng core theo tÆ°Æ¡ng tÃ¡c thá»±c táº¿ giá»¯a SME vÃ  Student. KhÃ´ng test theo kiá»ƒu má»™t role hoÃ n thÃ nh toÃ n bá»™ thao tÃ¡c rá»“i má»›i Ä‘á»•i sang role cÃ²n láº¡i. Má»—i bÆ°á»›c Ä‘á»u cÃ³ ngÆ°á»i thá»±c hiá»‡n, pháº£n há»“i cáº§n quan sÃ¡t vÃ  tráº¡ng thÃ¡i há»‡ thá»‘ng cáº§n xÃ¡c nháº­n trÆ°á»›c khi bÃ n giao cho bÃªn tiáº¿p theo.

## 1. Pháº¡m Vi

Luá»“ng Done cáº§n xÃ¡c nháº­n:

```text
SME Ä‘Äƒng project
-> Student apply
-> SME táº¡o offer
-> Student accept
-> SME thanh toÃ¡n PayOS tháº­t
-> Student ná»™p Sketch
-> SME review Sketch
-> Student ná»™p Final
-> SME review Final
-> escrow release
-> vÃ­ Student nháº­n net amount
```

Trong tranche hiá»‡n táº¡i:

- Withdrawal chá»‰ smoke thá»§ cÃ´ng.
- Admin xá»­ lÃ½ `ADMIN_REVIEW` qua Swagger.
- KhÃ´ng test refund split rules, rating, portfolio, package purchase, AI Matching hoáº·c automatic payout.

## 2. Chuáº©n Bá»‹

### 2.1. Cháº¡y há»‡ thá»‘ng

```powershell
cd D:\Codex
docker compose up -d --build
docker compose ps
```

Ká»³ vá»ng:

- `d4u-postgres`: `healthy`.
- `d4u-api`: running.
- `d4u-frontend`: running.
- `GET http://localhost:8080/health`: HTTP `200`.
- `GET http://localhost:8080/swagger`: HTTP `200`.
- `GET http://localhost:3000`: HTTP `200`.

### 2.2. PayOS live

Xem [PAYOS_LIVE_SMOKE_RUNBOOK_VI.md](PAYOS_LIVE_SMOKE_RUNBOOK_VI.md).

Vá»›i named tunnel, dÃ¹ng hostname á»•n Ä‘á»‹nh:

```text
https://d4u-demo.<domain>
```

Vá»›i Quick Tunnel chá»‰ dÃ¹ng táº¡m khi smoke:

```text
https://<random>.trycloudflare.com
```

Vá»›i named tunnel hoáº·c mÃ´i trÆ°á»ng deploy, dÃ¹ng public origin cho return URL:

```env
PAYMENT_PROVIDER=PayOS
PAYMENT_RETURN_URL=https://<public-origin>/payment/success
PAYMENT_CANCEL_URL=https://<public-origin>/payment/cancel
PAYMENT_PAYOS_CLIENT_ID=<secret>
PAYMENT_PAYOS_API_KEY=<secret>
PAYMENT_PAYOS_CHECKSUM_KEY=<secret>
```

Webhook pháº£i Ä‘Æ°á»£c confirm vá»›i PayOS:

```text
https://<public-origin>/api/v1/payments/payos/webhook
```

Vá»›i Quick Tunnel Ä‘á»ƒ smoke local trÃªn cÃ¹ng mÃ¡y, webhook váº«n dÃ¹ng HTTPS public nhÆ°ng return/cancel URL nÃªn quay vá» localhost Ä‘á»ƒ giá»¯ session SME:

```env
PAYMENT_RETURN_URL=http://localhost:3000/payment/success
PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel
```

### 2.3. TÃ i khoáº£n

Chuáº©n bá»‹ ba phiÃªn trÃ¬nh duyá»‡t hoáº·c ba profile riÃªng:

| PhiÃªn | Role | Má»¥c Ä‘Ã­ch |
| --- | --- | --- |
| A | SME | Táº¡o project, táº¡o offer, thanh toÃ¡n, review |
| B | Student | Apply, accept offer, upload vÃ  ná»™p bÃ i |
| C | Admin | Duyá»‡t verification vÃ  xá»­ lÃ½ `ADMIN_REVIEW` khi cáº§n |

KhÃ´ng dÃ¹ng cÃ¹ng má»™t browser profile cho SME vÃ  Student vÃ¬ token Ä‘Äƒng nháº­p sáº½ ghi Ä‘Ã¨ nhau.

### 2.4. Dá»¯ liá»‡u project máº«u

| TrÆ°á»ng | GiÃ¡ trá»‹ smoke |
| --- | --- |
| Project type | `OPEN` |
| Budget | `10000 VND` hoáº·c giÃ¡ trá»‹ nhá» há»£p lá»‡ |
| Revision | KhÃ´ng giá»›i háº¡n sá»‘ láº§n chá»‰nh sá»­a |
| Sketch deadline | Trong tÆ°Æ¡ng lai |
| Final deadline | Sau Sketch deadline |
| Total deadline | Sau Final deadline |

## 3. Luá»“ng TÆ°Æ¡ng TÃ¡c ChÃ­nh

### 3.0. Ká»‹ch Báº£n Thao TÃ¡c Chi Tiáº¿t Tá»«ng BÆ°á»›c

Pháº§n nÃ y lÃ  Ä‘Æ°á»ng cháº¡y chÃ­nh Ä‘á»ƒ tester thá»±c hiá»‡n láº§n Ä‘áº§u. DÃ¹ng hai cá»­a sá»• trÃ¬nh duyá»‡t song song:

- Cá»­a sá»• A: Ä‘Äƒng nháº­p SME.
- Cá»­a sá»• B: Ä‘Äƒng nháº­p Student.
- Thay `<public-origin>` báº±ng URL tunnel HTTPS Ä‘ang cháº¡y náº¿u test PayOS tháº­t.
- Ghi láº¡i `projectId`, `offerId` vÃ  `paymentId` khi chÃºng xuáº¥t hiá»‡n Ä‘á»ƒ Ä‘á»‘i chiáº¿u DB.

#### Cháº·ng 1: SME ÄÄƒng Project, Student Apply

**BÆ°á»›c 1 - SME má»Ÿ form táº¡o project**

1. Táº¡i cá»­a sá»• A, Ä‘Äƒng nháº­p tÃ i khoáº£n SME.
2. Má»Ÿ `<public-origin>/sme/projects/new`.
3. Kiá»ƒm tra tiÃªu Ä‘á» trang lÃ  `Táº¡o dá»± Ã¡n`.
4. KhÃ´ng báº¯t buá»™c dÃ¹ng AI Brief Assistant. Náº¿u muá»‘n kiá»ƒm tra AI mock, nháº­p `Ã tÆ°á»Ÿng thÃ´` tá»‘i thiá»ƒu 20 kÃ½ tá»± vÃ  báº¥m `Gá»£i Ã½ báº±ng AI`.

Káº¿t quáº£ cáº§n tháº¥y: form `ThÃ´ng tin dá»± Ã¡n` hiá»ƒn thá»‹ Ä‘áº§y Ä‘á»§.

**BÆ°á»›c 2 - SME nháº­p dá»¯ liá»‡u project**

Nháº­p dá»¯ liá»‡u máº«u:

| TrÆ°á»ng UI | GiÃ¡ trá»‹ máº«u |
| --- | --- |
| Danh má»¥c thiáº¿t káº¿ | Chá»n má»™t category Ä‘ang cÃ³ |
| TiÃªu Ä‘á» | `Smoke Test PayOS - <ngÃ y giá»>` |
| Brief | `Thiáº¿t káº¿ bá»™ nháº­n diá»‡n tá»‘i giáº£n cho chiáº¿n dá»‹ch thá»­ nghiá»‡m D4U.` |
| Má»¥c Ä‘Ã­ch sá»­ dá»¥ng | `Kiá»ƒm thá»­ luá»“ng core` |
| Loáº¡i dá»± Ã¡n | `OPEN` |
| NgÃ¢n sÃ¡ch | `10000` |
| Deadline sketch | Má»™t ngÃ y trong tÆ°Æ¡ng lai |
| Deadline final | Sau deadline sketch |
| Deadline tá»•ng | Sau deadline final |

Sau Ä‘Ã³ báº¥m `Táº¡o draft`.

Káº¿t quáº£ cáº§n tháº¥y:

- TrÃ¬nh duyá»‡t chuyá»ƒn sang project detail.
- Badge tráº¡ng thÃ¡i lÃ  `DRAFT`.
- Ghi láº¡i `projectId` tá»« URL `/sme/projects/{projectId}`.

**BÆ°á»›c 3 - SME publish project**

1. Táº¡i project detail, kiá»ƒm tra brief, budget vÃ  deadline.
2. Báº¥m `Publish`.
3. Chá» thÃ´ng bÃ¡o publish thÃ nh cÃ´ng.

Káº¿t quáº£ cáº§n tháº¥y: project chuyá»ƒn sang `OPEN`.

**BÆ°á»›c 4 - Student tÃ¬m project**

1. Chuyá»ƒn sang cá»­a sá»• B vÃ  Ä‘Äƒng nháº­p Student Ä‘Ã£ Ä‘Æ°á»£c verify.
2. Má»Ÿ `<public-origin>/student/projects`.
3. Báº¥m `LÃ m má»›i`.
4. TÃ¬m project theo tiÃªu Ä‘á» vá»«a nháº­p.
5. Báº¥m má»Ÿ project.

Káº¿t quáº£ cáº§n tháº¥y: trang detail hiá»ƒn thá»‹ Ä‘Ãºng brief, budget vÃ  deadline SME Ä‘Ã£ cáº¥u hÃ¬nh.

**BÆ°á»›c 5 - Student gá»­i á»©ng tuyá»ƒn**

1. Kiá»ƒm tra sidebar hiá»ƒn thá»‹ budget, Sketch deadline, Final deadline vÃ  Total deadline.
2. Báº¥m `Gá»­i á»©ng tuyá»ƒn` Ä‘á»ƒ test quick apply theo Ä‘iá»u khoáº£n project.

Káº¿t quáº£ cáº§n tháº¥y:

- UI bÃ¡o gá»­i thÃ nh cÃ´ng.
- Application lÆ°u `proposed_price` báº±ng budget project.
- Application lÆ°u ghi chÃº xÃ¡c nháº­n theo Ä‘iá»u khoáº£n cÃ´ng bá»‘ vÃ  khÃ´ng yÃªu cáº§u sá»‘ ngÃ y dá»± kiáº¿n.
- NÃºt apply chuyá»ƒn thÃ nh `ÄÃ£ á»©ng tuyá»ƒn` hoáº·c bá»‹ disable.
- KhÃ´ng gá»­i láº¡i application thá»© hai cho cÃ¹ng project.

Äá»ƒ test nhÃ¡nh custom proposal trÃªn má»™t project khÃ¡c:

1. Táº¡i sidebar project detail, báº¥m `Äá» xuáº¥t khÃ¡c`.
2. Nháº­p `GiÃ¡ Ä‘á» xuáº¥t má»›i` vÃ  `Giáº£i phÃ¡p Ä‘á» xuáº¥t` tá»‘i thiá»ƒu 20 kÃ½ tá»±.
3. Báº¥m `Tiáº¿p tá»¥c`, kiá»ƒm tra modal xÃ¡c nháº­n cuá»‘i rá»“i báº¥m `Gá»­i á»©ng tuyá»ƒn`.

Káº¿t quáº£ cáº§n tháº¥y: application lÆ°u Ä‘Ãºng giÃ¡ vÃ  giáº£i phÃ¡p Student vá»«a nháº­p.

**BÆ°á»›c 6 - SME nháº­n application**

1. Quay láº¡i cá»­a sá»• A.
2. Táº¡i project detail, báº¥m `Xem á»©ng tuyá»ƒn`.
3. Náº¿u danh sÃ¡ch chÆ°a cáº­p nháº­t, báº¥m `LÃ m má»›i`.
4. TÃ¬m application vá»«a gá»­i.

Káº¿t quáº£ cáº§n tháº¥y: SME Ä‘á»c Ä‘Æ°á»£c Student, giÃ¡ application vÃ  giáº£i phÃ¡p hoáº·c ghi chÃº xÃ¡c nháº­n theo Ä‘iá»u khoáº£n project.

#### Cháº·ng 2: SME Gá»­i Offer, Student Accept

**BÆ°á»›c 7 - SME gá»­i offer**

1. Trong danh sÃ¡ch á»©ng tuyá»ƒn, báº¥m `Chá»n vÃ  gá»­i offer` táº¡i application cá»§a Student.
2. Kiá»ƒm tra modal chá»‰ Ä‘á»c hiá»ƒn thá»‹ Student, giÃ¡ offer, giáº£i phÃ¡p hoáº·c ghi chÃº xÃ¡c nháº­n vÃ  háº¡n pháº£n há»“i cá»‘ Ä‘á»‹nh 48 giá».
3. Báº¥m `Gá»­i offer`.

Káº¿t quáº£ cáº§n tháº¥y:

- UI bÃ¡o gá»­i offer thÃ nh cÃ´ng.
- SME khÃ´ng nháº­p láº¡i giÃ¡ hoáº·c deadline.
- Backend láº¥y giÃ¡ offer tá»« application Ä‘Ã£ chá»n.
- Offer cÃ³ tráº¡ng thÃ¡i `WAITING_ACCEPTANCE`.
- Project chuyá»ƒn sang `OFFER_SELECTED`.

**BÆ°á»›c 8 - Student nháº­n vÃ  accept offer**

1. Quay láº¡i cá»­a sá»• B.
2. Má»Ÿ `<public-origin>/student/offers`.
3. Báº¥m `LÃ m má»›i`.
4. TÃ¬m offer Ä‘Ãºng project vÃ  Ä‘Ãºng sá»‘ tiá»n.
5. Báº¥m `Cháº¥p nháº­n`.

Káº¿t quáº£ cáº§n tháº¥y:

- UI bÃ¡o Ä‘Ã£ cháº¥p nháº­n offer vÃ  nháº¯c SME cáº§n thanh toÃ¡n escrow.
- Offer chuyá»ƒn sang `ACCEPTED`.
- Student chÆ°a Ä‘Æ°á»£c ná»™p Sketch cho tá»›i khi PayOS webhook xÃ¡c nháº­n thanh toÃ¡n.

#### Cháº·ng 3: SME Thanh ToÃ¡n PayOS Tháº­t

**BÆ°á»›c 9 - SME má»Ÿ workspace**

1. Quay láº¡i cá»­a sá»• A.
2. Má»Ÿ `<public-origin>/sme/offers`.
3. Báº¥m `LÃ m má»›i`.
4. Táº¡i offer vá»«a Ä‘Æ°á»£c accept, kiá»ƒm tra cÃ³ hai nÃºt:
   - `Workspace & escrow`: má»Ÿ trang Ä‘iá»u phá»‘i project.
   - `Thanh toÃ¡n PayOS`: má»Ÿ checkout PayOS trá»±c tiáº¿p tá»« danh sÃ¡ch offer.
5. Báº¥m `Workspace & escrow`.

Káº¿t quáº£ cáº§n tháº¥y:

- URL lÃ  `/projects/{projectId}/execution`.
- Card `Viá»‡c cáº§n lÃ m tiáº¿p theo` hiá»ƒn thá»‹ `Thanh toÃ¡n escrow qua PayOS`.
- Cá»™t tráº¡ng thÃ¡i hiá»ƒn thá»‹ offer `ACCEPTED`.

LÆ°u Ã½:

- NÃºt PayOS khÃ´ng náº±m táº¡i trang project detail `/sme/projects/{projectId}`.
- Náº¿u Ä‘ang á»Ÿ project detail, báº¥m `Workspace & escrow` trong card `Thao tÃ¡c`.
- Náº¿u khÃ´ng tháº¥y nÃºt `Workspace`, báº¥m `LÃ m má»›i` vÃ  kiá»ƒm tra Student Ä‘Ã£ báº¥m `Cháº¥p nháº­n` offer.
- Náº¿u muá»‘n bá» qua workspace, má»Ÿ `/sme/offers` vÃ  báº¥m `Thanh toÃ¡n PayOS`.

**BÆ°á»›c 10 - SME táº¡o checkout PayOS**

1. Trong workspace, táº¡i card `Viá»‡c cáº§n lÃ m tiáº¿p theo`, báº¥m `Má»Ÿ thanh toÃ¡n PayOS`.
2. Chá» tab checkout PayOS má»Ÿ ra.
3. Ghi láº¡i `paymentId` náº¿u xuáº¥t hiá»‡n trong return URL hoáº·c kiá»ƒm tra báº±ng Swagger.
4. KhÃ´ng Ä‘Ã³ng workspace gá»‘c; giá»¯ tab nÃ y Ä‘á»ƒ quan sÃ¡t tráº¡ng thÃ¡i.

Káº¿t quáº£ cáº§n tháº¥y:

- PayOS hiá»ƒn thá»‹ QR hoáº·c thÃ´ng tin chuyá»ƒn khoáº£n.
- Backend táº¡o payment `PENDING`.
- Escrow Ä‘Æ°á»£c táº¡o vá»›i tráº¡ng thÃ¡i `PENDING_PAYMENT`.
- Offer chuyá»ƒn sang `PENDING_PAYMENT`.

**BÆ°á»›c 11 - SME chuyá»ƒn khoáº£n tháº­t giÃ¡ trá»‹ nhá»**

1. DÃ¹ng á»©ng dá»¥ng ngÃ¢n hÃ ng quÃ©t QR PayOS.
2. Kiá»ƒm tra sá»‘ tiá»n lÃ  `10000 VND`.
3. XÃ¡c nháº­n chuyá»ƒn khoáº£n.
4. Chá» PayOS chuyá»ƒn trÃ¬nh duyá»‡t vá» `/payment/success?paymentId=...`.

Káº¿t quáº£ cáº§n tháº¥y:

- Return page hiá»ƒn thá»‹ tráº¡ng thÃ¡i `Äang Ä‘á»‘i soÃ¡t vá»›i PayOS`, tiáº¿n Ä‘á»™, láº§n kiá»ƒm tra gáº§n nháº¥t vÃ  háº¡n checkout.
- Trang chá»‰ poll backend; khÃ´ng tá»± Ä‘Ã¡nh dáº¥u thÃ nh cÃ´ng tá»« query string.
- Backend Æ°u tiÃªn webhook vÃ  cÃ³ thá»ƒ reconcile trá»±c tiáº¿p vá»›i PayOS qua `GET /v2/payment-requests/{orderCode}` khi payment cÃ²n `PENDING`.
- Sau khi webhook hoáº·c reconcile trusted tá»« PayOS xÃ¡c nháº­n `PAID`, trang chuyá»ƒn vá» workspace.

**BÆ°á»›c 12 - XÃ¡c nháº­n project Ä‘Ã£ báº¯t Ä‘áº§u**

Táº¡i workspace SME:

1. Báº¥m `LÃ m má»›i`.
2. Kiá»ƒm tra:

| ThÃ nh pháº§n | GiÃ¡ trá»‹ ká»³ vá»ng |
| --- | --- |
| Project | `IN_PROGRESS` |
| Offer | `ACTIVE` |
| Payment | `SUCCESS` |
| Escrow | `FUNDED` |

Táº¡i cá»­a sá»• B:

1. Má»Ÿ `<public-origin>/student/my-projects`.
2. Báº¥m `LÃ m má»›i`.
3. Táº¡i project vá»«a thanh toÃ¡n, báº¥m `Workspace`.

Káº¿t quáº£ cáº§n tháº¥y: Student tháº¥y next action `Ná»™p Sketch`.

#### Cháº·ng 4: Student Ná»™p Sketch, SME Pháº£n Há»“i

**BÆ°á»›c 13 - Student upload Sketch**

1. Táº¡i workspace Student, nháº­p mÃ´ táº£: `Sketch vÃ²ng Ä‘áº§u cho bá»™ nháº­n diá»‡n`.
2. Báº¥m `Upload file`.
3. Chá»n má»™t file `.jpg`, `.png` hoáº·c `.pdf` nhá» hÆ¡n hoáº·c báº±ng 20 MB.
4. Chá» tÃªn file xuáº¥t hiá»‡n dÆ°á»›i nÃºt upload.
5. Báº¥m `Ná»™p bÃ i`.

Káº¿t quáº£ cáº§n tháº¥y:

- Submission má»›i cÃ³ milestone `SKETCH`.
- Submission cÃ³ status `SUBMITTED`.
- Project chuyá»ƒn sang `SKETCH_REVIEW`.

**BÆ°á»›c 14 - SME kiá»ƒm tra Sketch**

1. Quay láº¡i workspace SME.
2. Báº¥m `LÃ m má»›i`.
3. Kiá»ƒm tra next action lÃ  `Duyá»‡t Sketch`.
4. Trong báº£ng `Submission`, báº¥m tÃªn file Ä‘á»ƒ download.
5. Má»Ÿ file vÃ  kiá»ƒm tra ná»™i dung.

Káº¿t quáº£ cáº§n tháº¥y: SME download Ä‘Æ°á»£c file Student vá»«a ná»™p.

**BÆ°á»›c 15A - NhÃ¡nh duyá»‡t nhanh**

Náº¿u muá»‘n Ä‘i tháº³ng tá»›i Final:

1. SME báº¥m `Duyá»‡t`.
2. Student quay láº¡i workspace vÃ  báº¥m `LÃ m má»›i`.

Káº¿t quáº£ cáº§n tháº¥y:

- Sketch chuyá»ƒn sang `APPROVED`.
- Student tháº¥y next action `Ná»™p Final`.

**BÆ°á»›c 15B - NhÃ¡nh yÃªu cáº§u chá»‰nh sá»­a**

Náº¿u muá»‘n test vÃ²ng revision trÆ°á»›c:

1. SME báº¥m `YÃªu cáº§u chá»‰nh sá»­a`.
2. Nháº­p `Ná»™i dung cáº§n sá»­a`: `Äiá»u chá»‰nh mÃ u chá»§ Ä‘áº¡o vÃ  tÄƒng khoáº£ng cÃ¡ch logo.`
3. Chá»n `Háº¡n ná»™p láº¡i` trong tÆ°Æ¡ng lai.
4. XÃ¡c nháº­n modal.
5. Student báº¥m `LÃ m má»›i`.

Káº¿t quáº£ cáº§n tháº¥y:

- Project chuyá»ƒn sang `REVISION_REQUESTED`.
- Student tháº¥y feedback trong `Lá»‹ch sá»­ review`.
- Student tháº¥y next action `Ná»™p báº£n chá»‰nh sá»­a`.

**BÆ°á»›c 16 - Student ná»™p revision**

Chá»‰ cháº¡y náº¿u Ä‘Ã£ chá»n bÆ°á»›c 15B:

1. Student nháº­p mÃ´ táº£: `ÄÃ£ chá»‰nh mÃ u vÃ  khoáº£ng cÃ¡ch logo`.
2. Báº¥m `Upload file`, chá»n file má»›i.
3. Báº¥m `Ná»™p bÃ i`.
4. SME báº¥m `LÃ m má»›i`, download file revision vÃ  báº¥m `Duyá»‡t`.
5. Student báº¥m `LÃ m má»›i`.

Káº¿t quáº£ cáº§n tháº¥y:

- Revision round tÄƒng Ä‘á»ƒ lÆ°u lá»‹ch sá»­.
- Sketch cuá»‘i cÃ¹ng Ä‘Æ°á»£c approve.
- Student tháº¥y next action `Ná»™p Final`.

#### Cháº·ng 5: Student Ná»™p Final, Há»‡ Thá»‘ng Release Escrow

**BÆ°á»›c 17 - Student ná»™p Final**

1. Trong workspace Student, nháº­p mÃ´ táº£: `Final artwork vÃ  file bÃ n giao`.
2. Báº¥m `Upload file`.
3. Chá»n file Final há»£p lá»‡.
4. Báº¥m `Ná»™p bÃ i`.

Káº¿t quáº£ cáº§n tháº¥y:

- Submission má»›i cÃ³ milestone `FINAL`.
- Project chuyá»ƒn sang `FINAL_REVIEW`.

**BÆ°á»›c 18 - SME approve Final**

1. Quay láº¡i workspace SME.
2. Báº¥m `LÃ m má»›i`.
3. Download file Final vÃ  kiá»ƒm tra.
4. Báº¥m `Duyá»‡t`.

Káº¿t quáº£ cáº§n tháº¥y ngay:

- Final chuyá»ƒn sang `APPROVED`.
- Project chuyá»ƒn sang `COMPLETED`.
- Há»‡ thá»‘ng thá»­ release escrow ngay trong luá»“ng hoÃ n táº¥t.

**BÆ°á»›c 19 - Kiá»ƒm tra escrow release**

1. Táº¡i workspace SME hoáº·c Student, báº¥m `LÃ m má»›i`.
2. Kiá»ƒm tra escrow.
3. Náº¿u váº«n lÃ  `RELEASE_PENDING`, chá» tá»‘i Ä‘a khoáº£ng má»™t phÃºt Ä‘á»ƒ hosted worker retry rá»“i báº¥m `LÃ m má»›i` láº¡i.

Káº¿t quáº£ cáº§n tháº¥y:

- Escrow chuyá»ƒn sang `RELEASED`.
- Chá»‰ cÃ³ má»™t disbursement.
- Chá»‰ cÃ³ má»™t wallet transaction `DISBURSEMENT_CREDIT`.

**BÆ°á»›c 20 - Student kiá»ƒm tra vÃ­**

1. Táº¡i cá»­a sá»• B, má»Ÿ `<public-origin>/student/wallet`.
2. Báº¥m `LÃ m má»›i`.
3. Kiá»ƒm tra card `CÃ³ thá»ƒ rÃºt`.
4. Kiá»ƒm tra báº£ng `Ledger`.

Káº¿t quáº£ cáº§n tháº¥y:

- Available balance tÄƒng Ä‘Ãºng `netAmount`.
- Ledger cÃ³ transaction `DISBURSEMENT_CREDIT`.
- `netAmount = grossAmount - platformFeeAmount`.
- CÃ³ thá»ƒ má»Ÿ rá»™ng dÃ²ng ledger Ä‘á»ƒ xem gross amount, platform fee vÃ  net amount.

#### Cháº·ng 6: Withdrawal Manual Smoke

Chá»‰ cháº¡y khi vÃ­ Student cÃ³ Ã­t nháº¥t `50000 VND`.

**BÆ°á»›c 21 - Student lÆ°u tÃ i khoáº£n nháº­n tiá»n**

1. Trong `/student/wallet`, táº¡i card `PhÆ°Æ¡ng thá»©c nháº­n tiá»n`, nháº­p:

| TrÆ°á»ng UI | GiÃ¡ trá»‹ máº«u |
| --- | --- |
| NgÃ¢n hÃ ng | `Vietcombank` |
| MÃ£ ngÃ¢n hÃ ng | `VCB` |
| Chá»§ tÃ i khoáº£n | `NGUYEN VAN A` |
| Sá»‘ tÃ i khoáº£n | `1234567890` |

2. Báº¥m `LÆ°u tÃ i khoáº£n`.

Káº¿t quáº£ cáº§n tháº¥y: Student chá»‰ tháº¥y ngÃ¢n hÃ ng, chá»§ tÃ i khoáº£n vÃ  sá»‘ tÃ i khoáº£n Ä‘Ã£ mask.

**BÆ°á»›c 22 - Student táº¡o withdrawal**

1. Táº¡i card `Táº¡o yÃªu cáº§u rÃºt tiá»n`, chá»n tÃ i khoáº£n nháº­n cÃ³ Ä‘áº§y Ä‘á»§ ngÃ¢n hÃ ng.
2. Nháº­p sá»‘ tiá»n tá»‘i thiá»ƒu `50000`.
3. Gá»­i yÃªu cáº§u.

Káº¿t quáº£ cáº§n tháº¥y:

- Withdrawal cÃ³ status `PENDING`.
- Available balance giáº£m.
- Locked balance tÄƒng cÃ¹ng amount.
- Fee rÃºt tiá»n lÃ  `0 VND`, `netAmount = amount`.
- KhÃ´ng thá»ƒ táº¡o withdrawal thá»© hai khi request hiá»‡n táº¡i cÃ²n `PENDING` hoáº·c `PROCESSING`.

**BÆ°á»›c 23 - Admin xá»­ lÃ½ thá»§ cÃ´ng**

1. Táº¡i cá»­a sá»• C, Ä‘Äƒng nháº­p Admin.
2. Má»Ÿ `<public-origin>/admin/withdrawals`.
3. TÃ¬m withdrawal vá»«a táº¡o.
4. Báº¥m `Nháº­n xá»­ lÃ½`, kiá»ƒm tra withdrawal chuyá»ƒn sang `PROCESSING`.
5. Chuyá»ƒn khoáº£n ngoÃ i há»‡ thá»‘ng tá»›i Ä‘Ãºng ngÃ¢n hÃ ng, chá»§ tÃ i khoáº£n, sá»‘ tÃ i khoáº£n Ä‘áº§y Ä‘á»§ vÃ  ná»™i dung chuyá»ƒn khoáº£n hiá»ƒn thá»‹ trÃªn hÃ ng withdrawal.
6. Báº¥m `ÄÃ£ chuyá»ƒn khoáº£n`, nháº­p mÃ£ giao dá»‹ch ngÃ¢n hÃ ng vÃ  thá»i gian chuyá»ƒn.

Káº¿t quáº£ cáº§n tháº¥y:

- Withdrawal chuyá»ƒn `PENDING -> PROCESSING -> COMPLETED`.
- Admin cÃ³ Ä‘á»§ `NgÃ¢n hÃ ng`, `Chá»§ TK`, `Sá»‘ TK`, `Sá»‘ tiá»n chuyá»ƒn` vÃ  `Ná»™i dung CK`.
- Locked balance giáº£m.
- Ledger cÃ³ `WITHDRAWAL_DEBIT`.

#### Cháº·ng 7: Ghi BiÃªn Báº£n

**BÆ°á»›c 24 - LÆ°u checkpoint**

1. Ghi láº¡i project ID, offer ID, payment ID vÃ  PayOS order code.
2. Cháº¡y SQL táº¡i má»¥c 5.
3. Äiá»n biÃªn báº£n táº¡i má»¥c 6.
4. KhÃ´ng ghi Client ID, API Key hoáº·c Checksum Key vÃ o tÃ i liá»‡u hoáº·c screenshot.

### TC-CORE-01: SME ÄÄƒng Project, Student NhÃ¬n Tháº¥y Project

| BÆ°á»›c | Actor | HÃ nh Ä‘á»™ng | Pháº£n há»“i cáº§n quan sÃ¡t | Tráº¡ng thÃ¡i ká»³ vá»ng |
| --- | --- | --- | --- | --- |
| 1 | SME | ÄÄƒng nháº­p vÃ  má»Ÿ `/sme/projects/new`. | Form táº¡o project hiá»ƒn thá»‹. | SME session há»£p lá»‡. |
| 2 | SME | Táº¡o draft project. | Project detail hiá»ƒn thá»‹ tráº¡ng thÃ¡i draft. | Project `DRAFT`. |
| 3 | SME | Publish project. | SME tháº¥y tráº¡ng thÃ¡i Ä‘Ã£ má»Ÿ. | Project `OPEN`. |
| 4 | Student | Refresh `/student/projects`. | Project má»›i xuáº¥t hiá»‡n trong marketplace. | Student Ä‘á»c Ä‘Æ°á»£c project `OPEN`. |
| 5 | Student | Má»Ÿ project detail. | Brief, budget vÃ  deadline Ä‘Ãºng dá»¯ liá»‡u SME nháº­p. | ChÆ°a cÃ³ application. |

API há»— trá»£:

```text
POST /api/v1/projects
POST /api/v1/projects/{projectId}/publish
GET  /api/v1/projects
GET  /api/v1/projects/{projectId}
```

### TC-CORE-02: Student Apply, SME Nháº­n Application

| BÆ°á»›c | Actor | HÃ nh Ä‘á»™ng | Pháº£n há»“i cáº§n quan sÃ¡t | Tráº¡ng thÃ¡i ká»³ vá»ng |
| --- | --- | --- | --- | --- |
| 1 | Student | Táº¡i project detail, gá»­i application. | UI bÃ¡o gá»­i thÃ nh cÃ´ng. | Application `SUBMITTED`. |
| 2 | SME | Refresh `/sme/projects/{projectId}/applications`. | Application cá»§a Student xuáº¥t hiá»‡n. | SME Ä‘á»c Ä‘Æ°á»£c cover letter vÃ  proposed price. |
| 3 | Student | Gá»­i application láº§n hai cho cÃ¹ng project. | API/UI tá»« chá»‘i duplicate apply. | Chá»‰ cÃ³ má»™t application. |

API há»— trá»£:

```text
POST /api/v1/projects/{projectId}/applications
GET  /api/v1/projects/{projectId}/applications
```

### TC-CORE-03: SME Gá»­i Offer, Student Accept

| BÆ°á»›c | Actor | HÃ nh Ä‘á»™ng | Pháº£n há»“i cáº§n quan sÃ¡t | Tráº¡ng thÃ¡i ká»³ vá»ng |
| --- | --- | --- | --- | --- |
| 1 | SME | Chá»n application vÃ  táº¡o offer. | UI bÃ¡o táº¡o offer thÃ nh cÃ´ng. | Offer `WAITING_ACCEPTANCE`; project `OFFER_SELECTED`. |
| 2 | Student | Refresh `/student/offers`. | Offer má»›i xuáº¥t hiá»‡n vá»›i amount vÃ  deadline. | Student tháº¥y Ä‘Ãºng offer. |
| 3 | Student | Accept offer. | UI bÃ¡o cháº¥p nháº­n thÃ nh cÃ´ng. | Offer `ACCEPTED`. |
| 4 | SME | Refresh `/sme/offers`. | NÃºt thanh toÃ¡n hoáº·c workspace kháº£ dá»¥ng. | SME cÃ³ thá»ƒ báº¯t Ä‘áº§u PayOS checkout. |

API há»— trá»£:

```text
POST /api/v1/projects/{projectId}/offers
POST /api/v1/offers/{offerId}/accept
POST /api/v1/offers/{offerId}/reject
```

### TC-CORE-04: SME Thanh ToÃ¡n PayOS Tháº­t, Student ÄÆ°á»£c Báº¯t Äáº§u

| BÆ°á»›c | Actor | HÃ nh Ä‘á»™ng | Pháº£n há»“i cáº§n quan sÃ¡t | Tráº¡ng thÃ¡i ká»³ vá»ng |
| --- | --- | --- | --- | --- |
| 1 | SME | Má»Ÿ `/projects/{projectId}/execution`. | Workspace hiá»ƒn thá»‹ next action `PAY_ESCROW`. | Offer `ACCEPTED`. |
| 2 | SME | Chá»n `Má»Ÿ thanh toÃ¡n PayOS`. | Checkout PayOS hoáº·c QR má»Ÿ ra. | Payment `PENDING`; escrow `PENDING_PAYMENT`; offer `PENDING_PAYMENT`. |
| 3 | SME | QuÃ©t QR vÃ  chuyá»ƒn khoáº£n tháº­t giÃ¡ trá»‹ nhá». | PayOS chuyá»ƒn vá» `/payment/success?paymentId=...`. | Return page chá»‰ poll backend má»—i 2 giÃ¢y. |
| 4 | System | PayOS gá»i webhook public HTTPS. | Webhook tráº£ HTTP `2xx`. | Signature há»£p lá»‡. |
| 5 | System | Backend xá»­ lÃ½ webhook. | Return page chuyá»ƒn vá» workspace sau khi backend xÃ¡c nháº­n. | Payment `SUCCESS`; escrow `FUNDED`; offer `ACTIVE`; project `IN_PROGRESS`. |
| 6 | Student | Refresh `/student/my-projects`, má»Ÿ workspace. | Next action lÃ  `SUBMIT_SKETCH`. | Student báº¯t Ä‘áº§u thá»±c hiá»‡n project. |

Äiá»ƒm kiá»ƒm soÃ¡t quan trá»ng:

- KhÃ´ng sá»­a payment thÃ nh `SUCCESS` chá»‰ vÃ¬ trÃ¬nh duyá»‡t quay vá» return URL.
- Webhook gá»­i láº¡i khÃ´ng táº¡o cáº­p nháº­t trÃ¹ng.
- Payment `FAILED`, `CANCELLED` hoáº·c `EXPIRED` khÃ´ng Ä‘Æ°á»£c báº¯t Ä‘áº§u project.

API há»— trá»£:

```text
POST /api/v1/offers/{offerId}/payment
GET  /api/v1/payments/{paymentId}
POST /api/v1/payments/payos/webhook
GET  /api/v1/projects/{projectId}/workspace
```

### TC-CORE-05: Student Ná»™p Sketch, SME Approve

| BÆ°á»›c | Actor | HÃ nh Ä‘á»™ng | Pháº£n há»“i cáº§n quan sÃ¡t | Tráº¡ng thÃ¡i ká»³ vá»ng |
| --- | --- | --- | --- | --- |
| 1 | Student | Trong workspace, upload file Sketch jpg/png/pdf tá»‘i Ä‘a 20 MB. | File upload thÃ nh cÃ´ng vÃ  hiá»‡n trong danh sÃ¡ch. | File metadata Ä‘Æ°á»£c lÆ°u. |
| 2 | Student | Ná»™p Sketch. | Timeline chuyá»ƒn sang chá» SME review. | Submission `SKETCH`, status `SUBMITTED`; project `SKETCH_REVIEW`. |
| 3 | SME | Refresh cÃ¹ng workspace. | Next action `REVIEW_SKETCH`; SME download Ä‘Æ°á»£c file. | SME Ä‘á»c Ä‘Ãºng submission. |
| 4 | SME | Approve Sketch. | Timeline má»Ÿ bÆ°á»›c Final cho Student. | Sketch `APPROVED`; project `IN_PROGRESS`. |
| 5 | Student | Refresh workspace. | Next action `SUBMIT_FINAL`. | Student cÃ³ thá»ƒ ná»™p Final. |

API há»— trá»£:

```text
POST /api/v1/files/submissions
POST /api/v1/projects/{projectId}/submissions
GET  /api/v1/files/{fileId}/download
POST /api/v1/projects/{projectId}/submissions/{submissionId}/approve
```

### TC-CORE-06: SME YÃªu Cáº§u Revision, Student Ná»™p Láº¡i

Cháº¡y case nÃ y trÃªn Sketch hoáº·c Final trÆ°á»›c khi approve.

| BÆ°á»›c | Actor | HÃ nh Ä‘á»™ng | Pháº£n há»“i cáº§n quan sÃ¡t | Tráº¡ng thÃ¡i ká»³ vá»ng |
| --- | --- | --- | --- | --- |
| 1 | SME | Táº¡i submission Ä‘ang chá» review, chá»n yÃªu cáº§u chá»‰nh sá»­a. | SME nháº­p ná»™i dung vÃ  háº¡n ná»™p láº¡i. | Submission `REVISION_REQUESTED`; project `REVISION_REQUESTED`. |
| 2 | Student | Refresh workspace. | Feedback vÃ  deadline xuáº¥t hiá»‡n; next action `SUBMIT_REVISION`. | Student tháº¥y Ä‘Ãºng yÃªu cáº§u. |
| 3 | Student | Upload file má»›i vÃ  ná»™p revision. | Timeline quay láº¡i chá» SME review. | Revision round tÄƒng; project trá»Ÿ láº¡i review milestone tÆ°Æ¡ng á»©ng. |
| 4 | SME | Refresh workspace vÃ  approve revision. | Milestone Ä‘Æ°á»£c duyá»‡t. | Revision round Ä‘Æ°á»£c lÆ°u Ä‘á»ƒ audit. |

SME cÃ³ thá»ƒ tiáº¿p tá»¥c yÃªu cáº§u revision khi cáº§n. Há»‡ thá»‘ng lÆ°u revision round Ä‘á»ƒ audit nhÆ°ng khÃ´ng giá»›i háº¡n sá»‘ láº§n chá»‰nh sá»­a.

### TC-CORE-07: SME BÃ¡o File Lá»—i, Student Upload Láº¡i

| BÆ°á»›c | Actor | HÃ nh Ä‘á»™ng | Pháº£n há»“i cáº§n quan sÃ¡t | Tráº¡ng thÃ¡i ká»³ vá»ng |
| --- | --- | --- | --- | --- |
| 1 | SME | Chá»n `BÃ¡o file lá»—i`, lÃ½ do vÃ­ dá»¥ `CANNOT_OPEN`, vÃ  háº¡n upload láº¡i. | Review history ghi nháº­n lÃ½ do. | Submission `INVALID_REPORTED`. |
| 2 | Student | Refresh workspace. | Student tháº¥y invalid-file reason vÃ  deadline upload láº¡i. | KhÃ´ng máº¥t lá»‹ch sá»­ submission cÅ©. |
| 3 | Student | Upload file há»£p lá»‡ vÃ  ná»™p láº¡i. | SME nháº­n submission má»›i Ä‘á»ƒ review. | Luá»“ng quay láº¡i milestone review. |

### TC-CORE-08: Student Ná»™p Final, SME Approve, VÃ­ ÄÆ°á»£c Credit

| BÆ°á»›c | Actor | HÃ nh Ä‘á»™ng | Pháº£n há»“i cáº§n quan sÃ¡t | Tráº¡ng thÃ¡i ká»³ vá»ng |
| --- | --- | --- | --- | --- |
| 1 | Student | Upload vÃ  ná»™p Final sau khi Sketch approved. | Timeline chuyá»ƒn sang chá» Final review. | Submission `FINAL`, status `SUBMITTED`; project `FINAL_REVIEW`. |
| 2 | SME | Refresh workspace, download Final vÃ  approve. | Workspace hiá»ƒn thá»‹ hoÃ n thÃ nh. | Final `APPROVED`; project `COMPLETED`; escrow `RELEASE_PENDING`. |
| 3 | System | Hosted worker xá»­ lÃ½ escrow release. | KhÃ´ng cáº§n thao tÃ¡c thá»§ cÃ´ng. | Escrow `RELEASED`; má»™t disbursement `COMPLETED`. |
| 4 | Student | Refresh `/student/wallet`. | Available balance tÄƒng Ä‘Ãºng net amount. | Má»™t transaction `DISBURSEMENT_CREDIT`. |
| 5 | Admin hoáº·c Swagger | Gá»i retry release náº¿u cáº§n. | KhÃ´ng credit láº§n hai. | Balance khÃ´ng Ä‘á»•i; khÃ´ng cÃ³ disbursement trÃ¹ng. |

Net amount:

```text
netAmount = grossAmount - platformFeeAmount
```

### TC-CORE-09: Withdrawal Manual Smoke

| BÆ°á»›c | Actor | HÃ nh Ä‘á»™ng | Pháº£n há»“i cáº§n quan sÃ¡t | Tráº¡ng thÃ¡i ká»³ vá»ng |
| --- | --- | --- | --- | --- |
| 1 | Student | Táº¡o payment method ngÃ¢n hÃ ng. | Chá»‰ tháº¥y account number Ä‘Ã£ mask. | KhÃ´ng lÆ°u account number dáº¡ng rÃµ. |
| 2 | Student | Táº¡o withdrawal tá»‘i thiá»ƒu `50000 VND`. | Request xuáº¥t hiá»‡n trong lá»‹ch sá»­. | Available giáº£m; locked tÄƒng; withdrawal `PENDING`. |
| 3 | Admin | Má»Ÿ `/admin/withdrawals`, complete request sau chuyá»ƒn khoáº£n ngoÃ i há»‡ thá»‘ng. | Locked balance giáº£m. | Transaction `WITHDRAWAL_DEBIT`. |
| 4 | Student | Táº¡o request khÃ¡c; Admin chá»n fail. | Tiá»n locked quay láº¡i available. | Transaction `WITHDRAWAL_FAILED_REVERSAL`. |

## 4. Negative Cases Táº¡i Äiá»ƒm BÃ n Giao

| ID | Bá»‘i cáº£nh | Thao tÃ¡c | Ká»³ vá»ng |
| --- | --- | --- | --- |
| NEG-01 | Student chÆ°a verify | Student apply project | Bá»‹ cháº·n. |
| NEG-02 | Student Ä‘Ã£ apply | Student apply láº¡i cÃ¹ng project | Bá»‹ cháº·n duplicate. |
| NEG-03 | Student chÆ°a accept offer | SME táº¡o PayOS payment | Bá»‹ cháº·n. |
| NEG-04 | Browser má»Ÿ return URL thá»§ cÃ´ng | Client giáº£ láº­p payment success | Backend khÃ´ng Ä‘á»•i tráº¡ng thÃ¡i. |
| NEG-05 | Sketch chÆ°a approved | Student ná»™p Final | Bá»‹ cháº·n. |
| NEG-06 | Upload file `.zip` hoáº·c file lá»›n hÆ¡n 20 MB | Student upload submission | Bá»‹ cháº·n. |
| NEG-07 | SME khÃ´ng sá»Ÿ há»¯u project | SME má»Ÿ workspace hoáº·c download file | Bá»‹ cháº·n. |
| NEG-08 | Student khÃ´ng Ä‘Æ°á»£c chá»n | Student má»Ÿ workspace project khÃ¡c | Bá»‹ cháº·n. |
| NEG-09 | Release escrow cháº¡y láº¡i | Worker hoáº·c Admin retry | KhÃ´ng double credit. |
| NEG-10 | Withdrawal dÆ°á»›i `50000 VND` | Student táº¡o request | Bá»‹ cháº·n. |

## 5. SQL Checkpoints

Cháº¡y sau cÃ¡c Ä‘iá»ƒm bÃ n giao chÃ­nh:

```sql
select id, status, selected_student_profile_id
from projects
where id = '<project-id>';

select id, project_id, student_profile_id, status, offered_amount, payment_due_at
from project_offers
where project_id = '<project-id>'
order by created_at;

select id, escrow_id, status, provider, amount, paid_at
from payments
where escrow_id in (select id from escrows where project_id = '<project-id>')
order by created_at;

select id, project_id, status, amount, funded_at, released_at
from escrows
where project_id = '<project-id>';

select id, project_id, submission_type, milestone_type, revision_round, status, review_due_at
from project_submissions
where project_id = '<project-id>'
order by submitted_at;

select action, comment, requested_changes, invalid_file_reason, due_at, reupload_due_at
from review_actions
where project_id = '<project-id>'
order by created_at;

select escrow_id, gross_amount, platform_fee_amount, net_amount, status
from disbursements
where escrow_id in (select id from escrows where project_id = '<project-id>');

select user_id, available_balance, locked_balance, status
from wallets
where user_id = '<student-user-id>';

select type, amount, balance_after, reference_type, reference_id
from wallet_transactions
where wallet_id = '<wallet-id>'
order by created_at;
```

## 6. BiÃªn Báº£n Smoke Test

Ghi láº¡i tá»‘i thiá»ƒu:

| Má»¥c | GiÃ¡ trá»‹ |
| --- | --- |
| Thá»i gian test | |
| Branch vÃ  commit | |
| Public origin | |
| Project ID | |
| Offer ID | |
| Payment ID | |
| PayOS order code | |
| Webhook HTTP status | |
| Project status cuá»‘i | |
| Escrow status cuá»‘i | |
| Gross amount | |
| Platform fee | |
| Net wallet credit | |
| Retry release cÃ³ double credit khÃ´ng | |
| NgÆ°á»i test SME | |
| NgÆ°á»i test Student | |

KhÃ´ng ghi Client ID, API Key hoáº·c Checksum Key vÃ o biÃªn báº£n.

## 7. Bá»• Sung Kiá»ƒm Tra Workspace Ná»™p BÃ i

Ãp dá»¥ng cho route chung `/projects/{projectId}/execution`. Student vÃ  SME má»Ÿ cÃ¹ng URL nhÆ°ng tháº¥y giao diá»‡n theo vai trÃ² cá»§a mÃ¬nh. Workspace tá»± poll backend má»—i 5 giÃ¢y; nÃºt `LÃ m má»›i` váº«n dÃ¹ng Ä‘Æ°á»£c khi cáº§n kiá»ƒm tra ngay. Countdown deadline tá»± cáº­p nháº­t má»—i phÃºt vÃ  hiá»ƒn thá»‹ theo giá» Viá»‡t Nam.

### 7.0. Kiá»ƒm Tra Bá»‘ Cá»¥c VÃ  Deadline

1. Má»Ÿ workspace báº±ng SME rá»“i má»Ÿ láº¡i cÃ¹ng URL báº±ng Student.
2. Kiá»ƒm tra progress bar cÃ³ thá»© tá»± `Offer -> Escrow -> Sketch -> Revision -> Final -> HoÃ n thÃ nh`.
3. Kiá»ƒm tra sidebar `Má»‘c thá»i gian` hiá»ƒn thá»‹ Ä‘áº§y Ä‘á»§ Sketch, Final vÃ  ToÃ n dá»± Ã¡n.
4. Khi cÃ³ submission chá» review, kiá»ƒm tra deadline ná»•i báº­t chuyá»ƒn thÃ nh `Háº¡n SME duyá»‡t bÃ i`.
5. Khi SME yÃªu cáº§u chá»‰nh sá»­a hoáº·c bÃ¡o file lá»—i, kiá»ƒm tra deadline ná»•i báº­t chuyá»ƒn thÃ nh `Háº¡n Student ná»™p láº¡i`.

Káº¿t quáº£ cáº§n tháº¥y:

- Má»—i deadline hiá»ƒn thá»‹ cáº£ ngÃ y, giá» vÃ  countdown `CÃ²n ...` hoáº·c `QuÃ¡ háº¡n ...`.
- Student vÃ  SME tháº¥y cÃ¹ng dá»¯ liá»‡u deadline nhÆ°ng khá»‘i action phÃ¹ há»£p vá»›i vai trÃ².
- DÃ²ng thá»i gian tÆ°Æ¡ng tÃ¡c gá»™p hiá»ƒn thá»‹ offer, escrow, submission, feedback, approval vÃ  release theo thá»© tá»± má»›i nháº¥t trÆ°á»›c.

### 7.1. Student Chá»n File VÃ  XÃ¡c Nháº­n Ná»™p

1. Student má»Ÿ workspace khi next action lÃ  `Ná»™p Sketch`, `Ná»™p báº£n chá»‰nh sá»­a` hoáº·c `Ná»™p Final`.
2. Báº¥m `Chá»n file`, chá»n nhiá»u file `.jpg`, `.png` hoáº·c `.pdf`, má»—i file tá»‘i Ä‘a 20 MB.
3. Kiá»ƒm tra draft list hiá»ƒn thá»‹ tÃªn, Ä‘á»‹nh dáº¡ng, dung lÆ°á»£ng vÃ  nÃºt xÃ³a tá»«ng file.
4. XÃ³a má»™t file khá»i draft list. File bá»‹ xÃ³a khÃ´ng Ä‘Æ°á»£c upload.
5. Báº¥m `XÃ¡c nháº­n ná»™p bÃ i`.
6. Kiá»ƒm tra modal xÃ¡c nháº­n hiá»ƒn thá»‹ Ä‘Ãºng milestone, mÃ´ táº£ vÃ  danh sÃ¡ch file cÃ²n láº¡i.
7. Báº¥m `XÃ¡c nháº­n ná»™p`.

Káº¿t quáº£ cáº§n tháº¥y:

- File chá»‰ Ä‘Æ°á»£c upload sau bÆ°á»›c xÃ¡c nháº­n.
- Náº¿u má»™t file upload lá»—i, quÃ¡ trÃ¬nh dá»«ng vÃ  thÃ´ng bÃ¡o ghi rÃµ tÃªn file lá»—i.
- Sau khi thÃ nh cÃ´ng, draft list Ä‘Æ°á»£c xÃ³a vÃ  Student tháº¥y tráº¡ng thÃ¡i chá» SME duyá»‡t cÃ¹ng review deadline.
- File `.zip`, file lá»›n hÆ¡n 20 MB hoáº·c file giáº£ Ä‘uÃ´i cÃ³ ná»™i dung khÃ´ng khá»›p Ä‘á»‹nh dáº¡ng bá»‹ cháº·n.
- File upload thÃ nh cÃ´ng nhÆ°ng khÃ´ng Ä‘Æ°á»£c gáº¯n vÃ o submission sáº½ Ä‘Æ°á»£c worker dá»n sau 24 giá».

### 7.2. SME Xá»­ LÃ½ Báº£n Má»›i Nháº¥t

1. SME giá»¯ workspace Ä‘ang má»Ÿ sau khi Student ná»™p bÃ i.
2. Chá» tá»‘i Ä‘a 5 giÃ¢y hoáº·c báº¥m `LÃ m má»›i`.
3. Táº¡i panel `Báº£n Ä‘ang chá» duyá»‡t`, kiá»ƒm tra milestone, vÃ²ng audit, mÃ´ táº£, thá»i gian ná»™p, háº¡n duyá»‡t, countdown vÃ  file download.
4. Download file báº±ng nÃºt trong panel.
5. Chá»n má»™t trong ba action: `Duyá»‡t`, `YÃªu cáº§u chá»‰nh sá»­a`, `BÃ¡o file lá»—i`.

Káº¿t quáº£ cáº§n tháº¥y:

- Panel luÃ´n hiá»ƒn thá»‹ submission `SUBMITTED` hoáº·c `VALID` má»›i nháº¥t.
- `DÃ²ng thá»i gian tÆ°Æ¡ng tÃ¡c` gá»™p bÃ i ná»™p vÃ  pháº£n há»“i, sáº¯p xáº¿p má»›i nháº¥t trÆ°á»›c.
- Polling khÃ´ng xÃ³a draft file hoáº·c ná»™i dung mÃ´ táº£ Student Ä‘ang nháº­p.

### 7.3. NhÃ¡nh BÃ¡o File Lá»—i VÃ  Upload Láº¡i

1. SME báº¥m `BÃ¡o file lá»—i`, chá»n `CANNOT_OPEN`, nháº­p mÃ´ táº£ vÃ  háº¡n upload láº¡i.
2. Student chá» tá»‘i Ä‘a 5 giÃ¢y hoáº·c báº¥m `LÃ m má»›i`.
3. Kiá»ƒm tra Student tháº¥y next action `Ná»™p báº£n chá»‰nh sá»­a`, lÃ½ do file lá»—i vÃ  deadline trong `DÃ²ng thá»i gian tÆ°Æ¡ng tÃ¡c`.
4. Student chá»n file má»›i vÃ  xÃ¡c nháº­n ná»™p láº¡i.
5. SME chá» tá»‘i Ä‘a 5 giÃ¢y, kiá»ƒm tra panel Ä‘ang chá» duyá»‡t hiá»ƒn thá»‹ báº£n má»›i nháº¥t rá»“i download vÃ  duyá»‡t.

Káº¿t quáº£ backend cáº§n tháº¥y:

- Submission cÅ© giá»¯ status `INVALID_REPORTED`.
- Project chuyá»ƒn sang `REVISION_REQUESTED`.
- Submission má»›i cÃ³ type `REVISION`, giá»¯ cÃ¹ng milestone Sketch hoáº·c Final.
- BÃ¡o file lá»—i ká»¹ thuáº­t khÃ´ng tÄƒng `current_revision_round`.
- `review_actions` giá»¯ action `REPORT_INVALID_FILE` Ä‘á»ƒ audit.

## 8. Regression Sau Core Stabilization

### 8.1. Offer Háº¿t Háº¡n Tráº£ Application Vá» HÃ ng Chá»

1. Táº¡o offer tá»« má»™t application vÃ  Ä‘á»ƒ offer `WAITING_ACCEPTANCE`.
2. Äáº·t `expires_at` cá»§a offer vá» quÃ¡ khá»© hoáº·c chá» worker cháº¡y.
3. Kiá»ƒm tra offer chuyá»ƒn `EXPIRED`.
4. Kiá»ƒm tra application liÃªn káº¿t trá»Ÿ vá» `SUBMITTED`, khÃ´ng bá»‹ káº¹t á»Ÿ `SELECTED`.
5. Kiá»ƒm tra project trá»Ÿ vá» `OPEN` hoáº·c `PRIVATE_INVITED` náº¿u khÃ´ng cÃ²n offer active.

### 8.2. Checkout PayOS Háº¿t Háº¡n NhÆ°ng Offer Váº«n CÃ²n Thá»i Gian

1. Táº¡o checkout PayOS nhÆ°ng khÃ´ng thanh toÃ¡n.
2. Äáº·t `payments.expires_at` vá» quÃ¡ khá»© hoáº·c chá» quÃ¡ 15 phÃºt.
3. Kiá»ƒm tra payment chuyá»ƒn `EXPIRED`, offer chuyá»ƒn `PAYMENT_FAILED`.
4. Kiá»ƒm tra SME váº«n táº¡o Ä‘Æ°á»£c checkout má»›i náº¿u `payment_due_at` 72 giá» chÆ°a háº¿t háº¡n.
5. Táº¡o checkout retry má»›i, giá»¯ má»™t checkout cÅ© quÃ¡ háº¡n vÃ  kiá»ƒm tra worker khÃ´ng kÃ©o offer má»›i khá»i `PENDING_PAYMENT`.

### 8.3. Upload Submission ÄÆ°á»£c Harden

1. Upload file `.pdf` tháº­t, tá»‘i Ä‘a Ä‘Ãºng 20 MB: backend cháº¥p nháº­n.
2. Äá»•i tÃªn file text hoáº·c file thá»±c thi thÃ nh `.pdf`: backend tá»« chá»‘i vÃ¬ signature khÃ´ng khá»›p.
3. Upload file há»£p lá»‡ nhÆ°ng khÃ´ng submit: worker dá»n metadata vÃ  file local sau 24 giá».

### 8.4. Return Page KhÃ´ng Spinner VÃ´ Táº­n

1. Má»Ÿ `/payment/success?paymentId=<payment-id>` khi webhook chÆ°a tá»›i.
2. Sau tá»‘i Ä‘a 60 giÃ¢y, kiá»ƒm tra tráº¡ng thÃ¡i chá» Ä‘á»•i thÃ nh cáº£nh bÃ¡o.
3. Kiá»ƒm tra cÃ³ nÃºt `Kiá»ƒm tra láº¡i` vÃ  lá»‘i táº¯t vá» workspace hoáº·c danh sÃ¡ch offer.
