# GiaoAn Workspace VN — Batch150 P0/P1 to P2 Transition Gate & External Closure Guide

## Trạng thái mới nhất sau Batch150 — version 0.150.0

- Batch150 là batch chốt trước khi chuyển sang P2: cho phép **P2 source/local/private work** khi P0/P1 local/source/runtime evidence pass, nhưng vẫn chặn public rollout.
- Lệnh quyết định mới: `npm run p0-p1:to-p2-transition-gate`.
- Lệnh hướng dẫn việc không thể xử lý trong chat/local ZIP: `npm run p0-p1:external-closure-guide`.
- Public/hosted proof vẫn cần GitHub Actions Node24 + Vercel APP_URL + hosted save/export HTTPS + PNG visual smoke thật.
- Không claim production-ready, P0/P1 100%, hosted proof closed nếu chưa có artifact thật.

Lệnh Batch150:

```bash
npm run batch150:p0-p1-to-p2-transition-validate
npm run smoke:batch150
npm run p0-p1:to-p2-transition-gate
npm run p0-p1:external-closure-guide
npm run verify:batch150
```

---

# GiaoAn Workspace VN — Batch149 P0/P1 Maximum Closure & Security Cookie Hardening

## Trạng thái mới nhất sau Batch149

- Repo version: `0.149.0`.
- Batch149 tiếp tục đúng blocker P0/P1: đẩy local/source/runtime evidence lên tối đa trong repo, nhưng không claim hosted/public proof nếu chưa có GitHub Actions Node24 + Vercel APP_URL + PNG visual smoke thật.
- Nâng cấp P1 security: CSRF cookie trong `lib/runtime-security.ts` dùng `httpOnly: true`; logout cũng clear CSRF cookie với cùng posture.
- Lệnh mới: `npm run p0-p1:max-closure-runner` và `npm run p0-p1:max-closure-report` sau khi `source:validate`, `data:validate`, hosted dry reports và `typecheck` đã chạy riêng.
- Hosted/public proof, public rollout và production-ready vẫn false cho đến khi có external hosted evidence + production DB/security/legal review.
- Không thêm AI, không thêm payment, không tạo verified giả, không mở community auto-public.

Lệnh Batch149:

```bash
npm run batch149:p0-p1-max-closure-validate
npm run smoke:batch149
npm run p0-p1:max-closure-runner
npm run p0-p1:max-closure-report
npm run verify:batch149
```

---

# GiaoAn Workspace VN — Batch148 Hosted Proof Evidence Authenticity Lock

## Trạng thái mới nhất sau Batch148

- Repo version: `0.148.0`.
- Batch148 không thêm tính năng giáo viên mới; batch này tiếp tục xử lý blocker P0 hosted/public proof.
- Nâng cấp chính: thêm anti-stale/authenticity lock cho artifact GitHub Actions bằng timestamp spread, run identity, APP_URL origin consistency, sha256 manifest và screenshot PNG inventory.
- Lệnh mới: `npm run p0:hosted-proof-authenticity-lock` và `npm run p0:hosted-proof-authenticity-lock:strict`.
- Hosted/public proof vẫn chưa được claim nếu chưa có GitHub Actions Node24 thật + Vercel APP_URL + artifact PNG/JSON/MD cùng một run. Production-ready vẫn false cho tới khi có production DB/security/legal review.
- Không thêm AI, không thêm payment, không tạo verified giả, không mở community auto-public.

Lệnh Batch148:

```bash
npm run batch148:hosted-proof-authenticity-lock-validate
npm run smoke:batch148
npm run verify:batch148
```

---

# GiaoAn Workspace VN — Batch145 Hosted Proof Artifact Upload Closure

## Trạng thái mới nhất sau Batch145

- Repo version: `0.145.0`.
- Batch145 không thêm tính năng giáo viên mới; batch này xử lý blocker hosted/public proof sau khi Batch144 đã đóng Local/source P0/P1 ở mức source candidate.
- Workflow `.github/workflows/p0-hosted-final-proof.yml` giờ upload JSON reports, Markdown checklists và screenshot PNG thật từ `artifacts/visual-smoke/**/*.png`.
- Đây là source-level artifact upload closure; không được claim hosted proof closed/public rollout/production-ready nếu chưa có GitHub Actions Node24 + APP_URL + visual smoke screenshot thật + public rollout readiness pass.
- Không thêm AI, không thêm payment, không tạo verified giả, không mở community auto-public.

Lệnh Batch145:

```bash
npm run batch145:hosted-proof-artifact-upload-validate
npm run smoke:batch145
npm run verify:batch145
```

---

# GiaoAn Workspace VN — Batch142 P0 Node24 CI Provenance Hardening

## Trạng thái mới nhất sau Batch142

- Repo version: `0.142.0`.
- Batch142 sửa blocker hosted-proof evidence còn lại: một lần chạy Node24 local không còn có thể bị report/board tính nhầm là `Node24 CI/Vercel proof`.
- `verify:p0-deepest-node24-ci` giờ bật `GIAOAN_REQUIRE_NODE24=1` và `GIAOAN_REQUIRE_CI_PROVENANCE=1`. Artifact `artifacts/verify-p0-deepest-last-run.json` phải có `ciProvenance.githubActions=true`, `githubWorkflow`, `githubRunId` và `runnerOS` trước khi được tính là Node24 CI proof.
- Runtime/admin hosted proof board kiểm tra thêm `requireCiProvenance` trong contract của evidence `node24_ci_deepest`.
- Local Node24 vẫn hữu ích để debug, nhưng không được claim là CI/Vercel proof/public rollout.
- Hosted/public rollout vẫn bị chặn cho đến khi có GitHub Actions Node24 thật, APP_URL hosted smoke, hosted save/export smoke, browser visual smoke thật và P0-100 artifact riêng.
- Không thêm AI, không thêm thanh toán, không tạo verified giả, không auto-public community.

Lệnh Batch142:

```bash
npm run batch142:p0-node24-ci-provenance-validate
npm run source:validate
npm run data:validate
npm run smoke:batch142
npm run runtime:p0-hosted-ci-proof-report
```

---

# GiaoAn Workspace VN — Batch141 P0 Hosted Proof Artifact Disambiguation

## Trạng thái mới nhất sau Batch141

- Repo version: `0.141.0`.
- Batch141 sửa blocker hosted-proof evidence: `verify:release:strict` và `verify:p0-100-release` không còn dùng chung artifact nên report/board không thể đọc nhầm hosted strict smoke thành P0-100/public closure.
- `verify:release:strict` ghi `artifacts/verify-release-strict-last-run.json` với `proofProfile=hosted_release_strict`.
- `verify:p0-100-release` ghi `artifacts/verify-p0-100-release-last-run.json` với `proofProfile=p0_100_release`, `requireNode24=true`, `requireHostedUrl=true`, `requireVisualSmoke=true`.
- Runtime/admin hosted proof board chỉ tính pass khi artifact khớp `command`, `proofProfile`, required flags và các result id bắt buộc.
- Hosted/public rollout vẫn bị chặn cho đến khi có Node24 CI, APP_URL hosted smoke, hosted save/export smoke và browser visual smoke thật.
- Không thêm AI, không thêm thanh toán, không tạo verified giả, không auto-public community.

Lệnh Batch141:

```bash
npm run batch141:p0-hosted-proof-artifact-integrity-validate
npm run source:validate
npm run data:validate
npm run smoke:batch141
npm run runtime:p0-hosted-ci-proof-report
```

---

# GiaoAn Workspace VN — Batch140 P0/P1 Evidence Report Integrity Fix

## Trạng thái mới nhất sau Batch140

- Repo version: `0.140.0`.
- Batch140 sửa blocker evidence-quality của Batch139: runner artifact `status=running` hoặc `completed<total` không còn được report/board tính là pass chỉ vì `ok=true`.
- Runner artifact chỉ hỗ trợ claim local P0/P1 cao hơn khi `ok=true`, `status=pass`, `completed===total`, `commands.length===total`, và mọi command đều pass.
- Runner không gọi lồng `p0-p1:local-evidence-report`; chạy report sau khi runner hoàn tất.
- Hosted/public rollout vẫn bị chặn cho đến khi có Node24 CI, APP_URL hosted smoke và browser visual smoke thật.
- Không thêm AI, không thêm thanh toán, không tạo verified giả, không auto-public community.

Lệnh Batch140:

```bash
npm run batch140:p0-p1-evidence-integrity-validate
npm run source:validate
npm run data:validate
npm run smoke:batch140
npm run p0-p1:local-evidence-runner
npm run p0-p1:local-evidence-report
```

---

# GiaoAn Workspace VN — Batch139 P0/P1 Local Evidence Lift

## Trạng thái mới nhất sau Batch139

- Repo version: `0.139.0`.
- Batch139 không thêm tính năng giáo viên mới; batch này nâng chất lượng bằng chứng local P0/P1 trên Node22 bằng current-run artifacts.
- Mục tiêu chính: thay các ghi chú pass thủ công cho typecheck/SWC/preflight bằng artifact thật, thêm local evidence runner và local evidence board.
- Runtime board mới: `/api/runtime/p0-p1-local-evidence`.
- Admin board mới: `/api/admin/p0-p1-local-evidence-board`, yêu cầu quyền `security:read`.
- Lệnh report mới: `npm run p0-p1:local-evidence-report`.
- Lệnh runner mới: `npm run p0-p1:local-evidence-runner`.
- Public rollout vẫn bị chặn nếu thiếu Node24/Vercel/APP_URL/visual smoke proof thật.
- Không thêm AI, không thêm thanh toán, không tạo verified giả, không auto-public community.
- Không gọi production-ready nếu chưa có production DB/security/legal/hosted evidence review thật.

Lệnh Batch139:

```bash
npm run batch139:p0-p1-local-evidence-validate
npm run smoke:batch139
npm run p0-p1:local-evidence-runner
npm run p0-p1:stability-report
npm run p0:hosted-proof-execution-report
```

---

# GiaoAn Workspace VN — Batch138 P0 Hosted Proof Execution Gate

## Trạng thái mới nhất sau Batch138

- Repo version: `0.138.0`.
- Batch138 không thêm tính năng giáo viên mới; batch này tiếp tục P0/P1 để khóa hosted proof trước khi mở rộng P1/P2.
- Mục tiêu chính: thêm một P0 hosted proof execution gate đọc Node24 CI, APP_URL strict smoke, hosted save/export, visual smoke thật, P0/P1 stability, Batch137 capture board và public rollout readiness.
- Runtime board mới: `/api/runtime/p0-hosted-proof-execution-gate`.
- Admin board mới: `/api/admin/p0-hosted-proof-execution-gate-board`, yêu cầu quyền `security:read`.
- Lệnh report mới: `npm run p0:hosted-proof-execution-report`.
- Public rollout vẫn bị chặn nếu thiếu Node24/Vercel/APP_URL/visual smoke proof thật hoặc public rollout readiness report vẫn false.
- Không thêm AI, không thêm thanh toán, không tạo verified giả, không auto-public community.
- Không gọi production-ready nếu chưa có production DB/security/legal/hosted evidence review thật.

Lệnh Batch138:

```bash
npm run batch138:p0-hosted-proof-execution-validate
npm run p0:hosted-proof-execution-report
npm run smoke:batch138
npm run verify:batch138
```

---

# GiaoAn Workspace VN — Batch100 UX/Governance Polish

Repo demo web soạn giáo án / thiết kế bài dạy cho giáo viên Việt Nam, phục vụ định hướng lớp 1–12. Batch100 tiếp tục từ nhánh UI `b_XWG` và baseline Batch98: sửa menu/sidebar mobile không bị kẹt, khôi phục auth/governance guard, thêm luồng hướng dẫn 4 bước cho giáo viên, banner trạng thái dữ liệu, chuyển chế độ Dễ dùng/Tiêu chuẩn/Nâng cao ngay trên header/mobile drawer và khóa xuất file khi chưa có nội dung.

## Trạng thái mới nhất

- Repo version: `0.100.0`.
- Nền dữ liệu hiện tại: Batch92 Starter Data Expansion 1–12.
- Batch93: Runtime Metadata Smoke + Repository Identity Cleanup.
- Batch94: Visible Account Gate + Teacher-Friendly Auth UX.
- Batch95: Auth Runtime Gate + Server-Side Save/Export Guard.
- Batch96: Deep Auth/Membership Hardening + Fail-Fast Registry Diagnostics.
- Batch97: Version Consistency Fix + Real Runtime Auth/Invite Smoke Wiring.
- Batch98: Dependency/Build Closure + Real Auth Runtime Smoke Hardening.
- Batch100: UX/Governance Polish cho `b_XWG`, gồm mobile drawer closure, auth recovery, guided progress, visible mode switcher và safer export affordance.
- Starter data hiện có: 12 khối lớp, 134 phạm vi lớp/môn, 402 starter topics, 13 hoạt động/game starter.
- Tất cả dữ liệu starter vẫn là `seed` / `developing` / `starter_topic_frame_only`.
- `contentDepthAllowed=false`; không có reviewed/verified/approved_for_release được tạo bởi Batch92–94.
- Đăng ký/đăng nhập hiển thị ngay trên workspace.
- Người dùng có thể xem thử/tạo khung bài, nhưng lưu bản nháp và xuất DOCX/PDF được UI và server route yêu cầu gắn với tài khoản giáo viên thật (`authAccountId`).
- Không cho tự chọn admin/tổ trưởng khi đăng ký; quyền cao hơn chỉ cấp qua mã mời/tổ/trường/admin/reviewer.
- Chưa được claim production-ready nếu chưa chạy được install, typecheck, build, production live smoke, auth runtime smoke và hosted URL smoke trên host thật.





### Batch101 no-AI operating runtime foundation

Batch101 thay quota demo mở rộng bằng nền vận hành source-level có cấu hình gói, usage ledger và point ledger:

- `data/operating-plan-config.json` định nghĩa Free Cộng Đồng, Giáo viên Pro demo, Tổ chuyên môn demo và Trường học demo.
- `data/usage-ledger.json` và `data/point-ledger.json` khởi tạo rỗng; không đóng gói dữ liệu runtime nhạy cảm.
- `lib/operating-runtime.ts` kiểm quota tháng cho `save_lesson`, `export_docx`, `export_pdf`, phiếu/slide từ mẫu và ghi usage ledger bằng JSON fallback.
- `/api/operating/usage` trả entitlement snapshot; `/api/operating/foundation` trả operating board.
- Không bật payment thật, marketplace tiền mặt, quỹ tiền mặt, referral nhiều tầng hoặc đổi điểm thành tiền mặt.
- Đây chỉ là runtime foundation demo/source-level, chưa phải billing production hoặc DB-backed ledger.

Source-level check:

```bash
npm run batch101:operating-runtime-validate
npm run smoke:batch101
```

### Batch100 UX/governance polish policy

Batch100 không thêm AI, payment thật, marketplace, dữ liệu verified giả hoặc cộng đồng mở không kiểm duyệt. Batch này chỉ nâng cấp source-level UI/UX và guardrail hiển thị:

- Mobile menu/sidebar có nút **Đóng**, backdrop bấm ra ngoài, Escape key và khóa scroll nền bằng `body.mobile-menu-open`.
- Khôi phục khối **Tài khoản giáo viên**, thông điệp **Đăng nhập để lưu và xuất an toàn**, trường **Mã mời tổ/trường nếu có** và cảnh báo **Không cho tự chọn admin/tổ trưởng khi đăng ký**.
- Thêm **Luồng an toàn cho giáo viên** hiển thị trạng thái dữ liệu bằng ngôn ngữ dễ hiểu.
- Thêm **Đi bước tiếp theo** dạng progress 4 bước: chọn bài → tạo khung → lưu bằng tài khoản → checklist/xuất.
- Đưa chọn **Dễ dùng / Tiêu chuẩn / Nâng cao** lên desktop header và mobile drawer.
- `disableExportUntilContent` khóa nút xuất khi chưa có nội dung giáo án.
- Reset `data/auth-sessions.json` và `data/security-audit-events.json` về `[]` trước khi đóng gói.
- Vẫn không claim production-ready nếu chưa chạy install/build/live smoke/hosted smoke/browser QA thật.

### Batch98 runtime verification policy

Batch98 cố tình không claim build/deploy pass nếu dependency chưa cài đủ. Các smoke lưu/xuất bây giờ phải đi qua tài khoản giáo viên thật:

- `npm run live:smoke:clean` lấy CSRF, đăng ký tài khoản smoke, gọi `/api/auth/me`, lưu giáo án qua `/api/lessons`, rồi xuất DOCX/PDF bằng `lessonId`.
- `npm run hosted:url-smoke` cũng dùng register/login cookie thật trước khi save/export trên host.
- `npm run auth-invite:runtime-smoke` dùng temp data dir để kiểm admin invite, redeem một lần, reuse/revoked/expired bị chặn và login không tự nâng quyền.
- `npm run runtime:closure-report` tạo báo cáo phân loại rõ: source pass, dependency missing, build missing, runtime smoke chưa chạy hoặc đã pass/fail.

Nếu `npm ci`, `next:swc-ready`, `build:clean`, live smoke hoặc hosted smoke chưa pass thì chỉ được nói source-level/type-level, không được nói production-ready.

## Định vị đúng

Không định vị là “AI tạo giáo án”. Định vị đúng hơn: nền tảng soạn giáo án, chỉnh sửa bản nháp, xuất Word/PDF, lưu trữ học liệu và workspace cho giáo viên/tổ chuyên môn/trường học.

Trong bản demo này:

- Không gọi AI/model/API trả phí.
- Không có OpenAI/Gemini/Anthropic SDK hoặc API key.
- Không bật thanh toán thật.
- Không mở cộng đồng công khai không kiểm soát.
- Không claim dữ liệu seed/scaffold/starter là verified.
- Không tự sinh kiến thức sâu khi thiếu dữ liệu reviewed/foundation/nguồn duyệt.
- Giáo viên luôn phải kiểm tra, bổ sung nội dung bài học từ nguồn hợp pháp trước khi dùng chính thức.

## Luồng giáo viên cần test

1. Mở `/`.
2. Kiểm tra khối **Tài khoản giáo viên** ở đầu trang.
3. Thử đăng ký tài khoản giáo viên bằng email/mật khẩu tối thiểu 8 ký tự.
4. Đăng xuất rồi đăng nhập lại.
5. Chọn lớp, môn, bộ sách/nguồn, bài/chủ đề.
6. Bấm **Thiết kế bài dạy** để tạo khung bài dạy an toàn.
7. Chỉnh sửa nội dung trực tiếp.
8. Bấm **Lưu bản nháp**; UI phải yêu cầu tài khoản thật nếu chưa đăng nhập.
9. Xuất DOCX hoặc PDF; UI phải yêu cầu tài khoản thật nếu chưa đăng nhập.
10. Chạy checklist rule-based.
11. Mở file tải về để kiểm font, bố cục, watermark và cảnh báo dữ liệu.
12. Test tối thiểu lớp 1, lớp 5, lớp 6, lớp 10 và một luồng ôn thi nếu có.

## Công nghệ

- Next.js 15.3.8
- React 19.0.4
- TypeScript 5.7.3
- Tailwind CSS
- Next Route Handlers
- JSON/local fallback cho demo
- Auth email/mật khẩu demo bằng JSON fallback + session cookie HttpOnly
- DOCX OpenXML tối thiểu tự tạo
- PDF fallback tối thiểu

## Source-level checks

```bash
node --check scripts/validate-batch95-auth-runtime-gate-source.mjs
node scripts/validate-batch94-auth-gate-source.mjs
node scripts/validate-batch95-auth-runtime-gate-source.mjs
node scripts/validate-batch93-runtime-metadata-source.mjs
node scripts/validate-json-data.mjs
node scripts/validate-internal-imports.mjs
node scripts/run-source-validators.mjs
node scripts/hosted-demo-preflight.mjs
```

## Runtime/build cần chạy trên host thật

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run next:swc-ready
npm run typecheck
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
GIAOAN_DEMO_URL=https://your-vercel-domain.vercel.app npm run hosted:url-smoke
npm run verify:batch95
```

## Routes quan trọng

- `GET /api/auth/me` — kiểm phiên hiện tại.
- `POST /api/auth/register` — đăng ký tài khoản giáo viên, role mặc định teacher.
- `POST /api/auth/login` — đăng nhập email/mật khẩu, quyền cao cần membership/invite hợp lệ.
- `POST /api/auth/logout` — đăng xuất, yêu cầu CSRF.
- `GET /api/metadata` — metadata demo, starter catalog, coverage truth.
- `POST /api/template-builder` — tạo khung giáo án không-AI, bắt buộc same-origin + CSRF.
- `POST /api/export/docx` và `POST /api/export/pdf` — xuất file có quota guard và server-side real-account gate.
- `GET /api/activity-games` — starter activity/game library, không phải kho official.

## Giới hạn thật hiện tại

- Auth UI đã hiện source-level; Batch95 đã thêm server-side real-account gate cho save/export, nhưng chưa chứng minh runtime trên host thật.
- JSON fallback auth/session không phải production auth hoàn chỉnh; production cần DB, migration, backup, email verification, password reset, lockout policy và audit mạnh hơn.
- Dữ liệu vẫn là seed/developing/starter, chưa phải kho verified toàn bộ lớp 1–12.
- Starter topics giúp chọn nhanh và dựng khung an toàn, không chứng minh chất lượng học thuật.
- DOCX/PDF cần mở file thật để kiểm font/bố cục tiếng Việt.
- Runtime/build/deploy chỉ được xem là pass khi đã chạy trên host/CI thật.
- Mobile QA thật vẫn chưa được thay thế bởi source validator.
- Community/activity/game starter không được public official nếu thiếu nguồn/license/review/takedown.

## Tài liệu gần nhất

- `BATCH92_NOTES.md`
- `docs/BATCH92_STARTER_DATA_EXPANSION.md`
- `BATCH93_NOTES.md`
- `docs/BATCH93_RUNTIME_METADATA_SMOKE.md`
- `BATCH94_NOTES.md`
- `docs/BATCH94_VISIBLE_ACCOUNT_GATE.md`
- `BATCH95_NOTES.md`
- `docs/BATCH95_AUTH_RUNTIME_GATE.md`

## Batch96 — Deep Auth/Membership Hardening

Batch96 tiếp tục sau Batch95 bằng cách khóa sâu invite/membership:

- Không còn tự nâng quyền bằng `trusted-*` hoặc `role=admin/leader` từ client.
- Public register/login mặc định teacher nếu không có membership/invite thật.
- Membership invite có demo JSON store, trạng thái active/redeemed/revoked/expired.
- Sửa contract route `/api/admin/membership-invites` để dùng đúng `{ ok, invite }`.
- Sửa permission namespace cho content/admin flows không phụ thuộc bắt buộc vào lesson object.
- `registry:diagnose` fail-fast khi DNS/registry lỗi; không claim install/build nếu registry không truy cập được.

Lệnh source-level mới:

```bash
npm run auth-membership-hardening:validate
npm run smoke:batch96
```

## Tài liệu Batch100

- `BATCH100_NOTES.md`
- `docs/BATCH100_UX_GOVERNANCE_POLISH.md`
- `scripts/validate-batch100-ux-governance-polish-source.mjs`


## Batch143 — P0/P1 Final Closure Candidate

Batch143 adds a final P0/P1 closure board and harmonizes visual smoke evidence contracts. The canonical viewport ids are now `mobile-360`, `mobile-390`, `mobile-430`, `tablet-768`, `desktop-1366`, and `desktop-1440`. Use `APP_URL=https://<vercel-url> npm run visual:smoke:evidence-capture` to capture real Chromium screenshots before `npm run visual:smoke:evidence-validate`.

Key commands:

```bash
npm run batch143:p0-p1-final-closure-validate
npm run p0-p1:final-closure-report
APP_URL=https://<vercel-url> npm run visual:smoke:evidence-capture
npm run visual:smoke:evidence-validate
npm run verify:batch143
```

Claim policy: local/source P0/P1 may be a closure candidate when local gates pass, but public/hosted/production claims remain blocked until Node24 GitHub Actions provenance, APP_URL hosted smoke, hosted save/export smoke, screenshot-backed visual evidence, and P0-100 release proof all pass.

## Batch144 — P0/P1 Local Build Closure

Batch144 giải quyết blocker build/page-data còn lại trước khi đóng local P0/P1: guarded build và raw build diagnostic đều xoá `.next` trước khi chạy để artifact là current-run proof. P0/P1 local evidence giờ bắt buộc raw Next build exit 0 (`raw_build_diagnostic`) ngoài guarded build, live smoke, auth invite smoke, loopback hosted-style smoke và security/data protection report.

Claim hợp lệ sau khi verify pass: local/source P0/P1 closure candidate. Hosted/public proof, production-ready và public rollout vẫn bị chặn nếu thiếu Node24 GitHub Actions, hosted APP_URL, visual screenshots thật, production DB/security/legal review.


## Batch146 — Hosted Proof Runner Hardening

Batch146 đẩy hosted/public proof lên mức source-level cao hơn bằng cách thêm strict preflight, dry-run preflight, final evidence summary và GitHub Step Summary cho workflow `p0-hosted-final-proof.yml`.

Key commands:

```bash
npm run p0:hosted-proof-preflight:dry
npm run batch146:hosted-proof-runner-hardening-validate
npm run smoke:batch146
APP_URL=https://<vercel-url> npm run visual:smoke:evidence-capture
npm run p0:hosted-proof-summary
```

Claim policy: Batch146 chỉ harden runner/auditability. Hosted proof vẫn chưa đóng nếu chưa có GitHub Actions Node24 + APP_URL + screenshots + hosted smoke + public rollout artifacts pass. Production-ready vẫn cần production DB/security/legal review riêng.
