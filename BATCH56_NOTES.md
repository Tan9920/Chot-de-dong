# Batch56 — Release Dossier & Human Sign-off Gate Hardening

Ngày: 27/04/2026

Batch56 tiếp tục sau Batch55 theo hướng nghiêm hơn về pháp lý, học thuật và minh bạch công khai. Batch này KHÔNG production-ready, KHÔNG tạo kiến thức giả, KHÔNG thêm AI, KHÔNG thêm billing thật và KHÔNG nâng seed/scaffold thành verified giả.

## Mục tiêu

Sau Batch55 đã có public trust policy, nhưng trước khi giáo án/tài nguyên được export chính thức, chia sẻ cộng đồng, public marketing hoặc phát hành cấp trường, hệ thống cần một hồ sơ phát hành có thể kiểm tra được. Batch56 thêm release dossier để khóa rủi ro:

- Không phát hành khi sourceStatus chưa reviewed hoặc thiếu reference.
- Không public khi còn takedown claim, copyrightRisk unknown/high hoặc legal asset chưa ready.
- Không tự sinh/khẳng định kiến thức sâu khi dữ liệu chỉ là seed/scaffold.
- Không bỏ qua xác nhận của giáo viên về nguồn, bản quyền, bối cảnh lớp học và minh chứng đánh giá.
- Không cho public/school release nếu thiếu sign-off theo vai trò: giáo viên, reviewer môn học, reviewer sư phạm, legal reviewer, school admin.
- Không nói quá ở marketing: không “chuẩn Bộ”, “đúng 100%”, “không vi phạm”, “dùng ngay không cần sửa”.

## File tạo mới

- `lib/release-dossier.ts`
- `app/api/release-dossier/readiness/route.ts`
- `app/api/admin/release-dossiers/route.ts`
- `data/release-dossier-snapshots.json`
- `scripts/validate-release-dossier.mjs`
- `scripts/smoke-batch56-release-dossier-source.mjs`
- `scripts/verify-batch56-source.mjs`
- `BATCH56_NOTES.md`

## File sửa

- `package.json`
- `prisma/schema.prisma`
- `lib/types.ts`
- `lib/teacher-lesson-frame.ts`
- `components/workspace.tsx`

## Điểm chính trong code

### Release dossier library

`lib/release-dossier.ts` thêm:

- `buildReleaseDossier()`
- `buildReleaseDossierLines()`
- `requiredSignOffRolesFor()`
- `readReleaseDossierSnapshots()`
- `saveReleaseDossierSnapshot()`

Dossier đánh giá theo:

- source status;
- release tier;
- support level;
- reference count;
- field evidence count;
- legal asset readiness;
- community moderation readiness;
- active takedown claim;
- copyright risk;
- xác nhận của giáo viên;
- calculator guidance approval;
- media provenance;
- public trust report;
- sign-off người thật.

### API readiness

`POST /api/release-dossier/readiness`:

- có `assertRuntimeRateLimit()`;
- có `assertWriteProtection()`;
- có `requireActiveSession()`;
- có `readJsonBody()`;
- lấy topic thật từ repository;
- chạy academic trace;
- chạy content safety;
- chạy teacher editable frame readiness;
- chạy public trust policy;
- tạo release dossier;
- tùy chọn lưu snapshot nếu `persistSnapshot=true`;
- ghi security audit event.

### Admin route

`GET /api/admin/release-dossiers`:

- yêu cầu quyền `content:review`;
- có rate limit;
- trả snapshot list và summary.

### Prisma prep

Thêm model `ReleaseDossierSnapshotRecord` để chuẩn bị DB-backed runtime, nhưng runtime hiện vẫn là JSON fallback cho tới khi Prisma generate/migrate được verify thật.

### Workspace/teacher frame

- Workspace hiển thị badge “Release dossier trước khi public”.
- Hero warning nói rõ trước khi public/phát hành cấp trường cần lập release dossier.
- Teacher frame checklist bổ sung yêu cầu release dossier và sign-off trước khi xuất/chia sẻ rộng.

## Script mới

- `npm run release:dossier-validate`
- `npm run smoke:batch56`
- `npm run verify:batch56`

## Verify đã chạy được trong môi trường audit

Các script source-level nên chạy:

```bash
node scripts/validate-release-dossier.mjs
node scripts/smoke-batch56-release-dossier-source.mjs
node scripts/verify-batch56-source.mjs
node scripts/source-lint.mjs
node scripts/validate-runtime-readiness.mjs
```

## Chưa verify được

Chưa được nói production-ready vì vẫn chưa chứng minh được:

- `npm install` pass thật;
- `npm run typecheck` pass thật;
- `npm run build` pass thật;
- `npx prisma generate` pass thật;
- `npx prisma db push` pass thật;
- Next server runtime thật;
- HTTP smoke thật với cookie/session/CSRF;
- DB-backed release dossier/community/legal runtime.

## Rủi ro còn lại

- Release dossier là gate/hồ sơ kiểm tra, không phải bảo đảm pháp lý tuyệt đối.
- JSON fallback chưa phù hợp concurrency production.
- Chưa có UI admin hoàn chỉnh để ký sign-off từng vai trò.
- Chưa có email/Zalo/in-app notification cho reviewer.
- Chưa có immutable audit log/WORM storage.
- Chưa có file upload security như antivirus/MIME/hash/duplicate scan.
- Dữ liệu lớp 1-12 vẫn seed/starter/scaffold, không phải verified corpus.

## Kết luận thật

Batch56 làm hệ thống nghiêm hơn và đáng tin hơn ở tầng release governance. Tuy nhiên repo vẫn chưa production-ready vì build/runtime/Prisma thật chưa verify. Không được quảng cáo là “chuẩn Bộ”, “đúng 100%”, “không vi phạm” hoặc “dùng ngay không cần sửa”.

Ghi chú kiểm chứng: release dossier là hồ sơ kiểm soát trước phát hành, không phải giấy bảo đảm pháp lý tuyệt đối.

Dòng kiểm tra chữ thường: batch này không production-ready, không tạo kiến thức giả, và release dossier chỉ là gate/hồ sơ minh bạch.
