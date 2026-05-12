# Batch51 — Community & Legal Asset Publication Gates

Ngày: 27/04/2026

## Mục tiêu

Batch51 tiếp tục sau Batch50, không thêm AI, không thêm billing/thanh toán thật, không tạo dữ liệu verified giả. Mục tiêu là khóa các rủi ro pháp lý và cộng đồng trước khi tài nguyên/học liệu có thể public rộng:

- Nội dung cộng đồng không được public nếu chưa qua moderation.
- Tài nguyên có rủi ro bản quyền `unknown` hoặc `high` không được public.
- Tài nguyên thiếu provenance/source/license/attribution không được public.
- Tài nguyên có yêu cầu takedown phải tự rút khỏi public và quay về hàng chờ review.
- Legal asset có vòng đời create/review/takedown rõ hơn.
- Public community listing chỉ trả tài nguyên đã qua publication readiness gate.

## Thay đổi chính

### Tạo mới

- `lib/community-moderation.ts`
  - Chuẩn hóa `CommunityResourceRecord`.
  - Đánh giá `assessCommunityResourcePublication()`.
  - Chặn public nếu chưa `approved`, `sourceStatus` dưới `reviewed`, copyright risk `unknown/high`, thiếu provenance, legal asset chưa approved hoặc có takedown.
  - `listPublicCommunityResources()` chỉ trả tài nguyên public thật sự an toàn.
  - `createCommunityResource()` đưa tài nguyên vào `moderation_queue`, không public ngay.
  - `reviewCommunityResource()` tự hạ khỏi public nếu còn blocker.
  - `requestCommunityResourceTakedown()` chuyển tài nguyên về `needs_review` + `moderation_queue`.

- `app/api/community/resources/route.ts`
  - `GET`: public listing nhưng lọc qua safe publication gate.
  - `POST`: user đăng nhập gửi tài nguyên; bắt CSRF/write protection/rate limit/body limit; tài nguyên vào hàng chờ kiểm duyệt, chưa public.

- `app/api/admin/community-resources/route.ts`
  - `GET`: reviewer/admin xem tài nguyên kèm readiness.
  - `PATCH`: review/publish/takedown; bắt quyền `content:review`, CSRF, rate limit, guarded JSON body.

- `app/api/admin/legal-assets/route.ts`
  - `GET`: xem legal asset registry.
  - `POST`: tạo legal asset ở trạng thái pending.
  - `PATCH`: review hoặc takedown legal asset.

- `scripts/validate-community-legal-gates.mjs`
  - Validator source-level không cần `tsx`.

- `scripts/verify-batch51-source.mjs`
  - Parse JSON, scan source, chặn needle AI/API/model phổ biến.

### Sửa

- `lib/legal-asset-library.ts`
  - Thêm `createLegalAssetRecord()`.
  - Thêm `reviewLegalAssetRecord()`.
  - Thêm `requestLegalAssetTakedown()`.
  - Thêm write JSON fallback cho legal asset registry.

- `lib/types.ts`
  - Mở rộng `CommunityResourceRecord` với `sourceUrl`, `license`, `attribution`, `legalAssetIds`, `publicApprovedAt`, `publicApprovedBy`, `takedownRequestedAt`, `takedownReason`.
  - Thêm `CommunityResourcePublicationReadiness` và issue type.

- `package.json`
  - Thêm `community:legal-gates-validate`.
  - Thêm `verify:batch51`.

## Giới hạn thật

- Đây là foundation/source-level gate, chưa phải dashboard moderation UI hoàn chỉnh.
- JSON fallback vẫn chưa phải audit log bất biến hoặc storage production-grade.
- Chưa có file upload thật, antivirus scan, perceptual hash, hoặc duplicate detection.
- Chưa có full public takedown form cho bên ngoài; route hiện đi qua admin/reviewer flow.
- Chưa verify Next runtime thật nếu không cài được dependencies.

## Lệnh kiểm tra ưu tiên

```bash
npm run community:legal-gates-validate
npm run verify:batch51
npm run lesson:context-safety-validate
npm run verify:batch50
npm run typecheck
npm run lint
npm run build
npx prisma generate
```
