# BATCH111 — Verified Academic 1–12 Readiness & Official Source Spine

## Phạm vi đúng của batch này

Batch111 chỉ tập trung Verified học thuật thật 1–12. Không mở rộng UI/UX, marketplace, community, payment, AI, referral, quỹ tiền mặt hay tính năng ngoài luồng.

Mục tiêu là tạo nền nâng verified thật: official source spine, readiness dossier, source-pack templates, reviewer/release gate, API board và report. Batch111 **không tạo verified giả**, **không bật contentDepthAllowed**, **không claim production-ready**, và **không nói coverage học thuật 1–12 đã verified**.

## Vì sao không nâng registry thành verified ngay

Dữ liệu trong repo trước Batch111 vẫn chủ yếu là seed/starter/scaffold. Theo guardrail đã chốt, một scope chỉ có thể nâng `reviewed`/`verified` khi có đủ:

- source pack hợp pháp cho lớp/môn/bài/chủ đề cụ thể;
- metadata nguồn, license/attribution, takedown path;
- reviewer thật với reviewerId, reviewerRole, reviewerSignoffAt;
- approved references;
- legal check;
- assessment/rubric review nếu có;
- export compliance label;
- release gate mở và audit log.

Vì chưa có reviewer chuyên môn thật và source pack bài/chủ đề thật trong file user gửi, Batch111 chỉ nâng **readiness/evidence infrastructure**, không nâng nhãn dữ liệu.

## File mới

- `data/official-curriculum-source-catalog.json`
- `data/academic-verification-readiness-dossier.json`
- `lib/academic-verification-accelerator.ts`
- `app/api/academic/verification-readiness/route.ts`
- `app/api/admin/academic-verification-readiness-board/route.ts`
- `scripts/academic-verification-readiness-report.mjs`
- `scripts/validate-batch111-academic-verification-source.mjs`
- `docs/BATCH111_VERIFIED_ACADEMIC_READINESS.md`
- `BATCH111_NOTES.md`

## File sửa

- `package.json` lên `0.111.0`
- `package-lock.json` lên `0.111.0`
- `scripts/run-source-validators.mjs` đăng ký Batch111 vào source validator

## Scripts mới

- `npm run batch111:academic-verification-validate`
- `npm run academic:verification-readiness-validate`
- `npm run academic:verification-readiness-report`
- `npm run smoke:batch111`
- `npm run verify:batch111`

## Trạng thái thật

- Official source spine: có 4 văn bản nguồn/điều chỉnh chính thống được lưu metadata.
- Source spine cho grade bands 1–5, 6–9, 10–12: có.
- Source pack bài/chủ đề thật: chưa có.
- Reviewer thật: chưa có.
- `verifiedOrApproved` trong registry: không tăng.
- `contentDepthAllowed`: không tăng.
- Deep content: vẫn khóa.
- Casio/câu hỏi/đáp án/nội dung sâu: vẫn không được tự sinh nếu thiếu dữ liệu đã duyệt.

## Không được claim

- Không nói “đã verified 1–12”.
- Không nói “chuẩn Bộ/đúng 100%”.
- Không nói “có thể dùng chính thức ngay”.
- Không gộp `officialSourceSpineReadyPercent` với `verifiedOrApprovedPercent`.
- Không claim hosted/runtime/build pass nếu chưa chạy thật.

## Hướng batch kế tiếp nếu có bằng chứng thật

Nếu user cung cấp source pack/reviewer thật cho vài scope nhỏ, batch kế tiếp nên là:

**Batch112 — First Reviewed Scope Release Dossier**

Chỉ nâng rất ít scope có bằng chứng thật, ví dụ 1–3 bài/chủ đề, có audit log, không tăng ồ ạt.


## Batch111 guardrail exact

Không tạo verified giả và không bật contentDepthAllowed khi chưa có reviewer/source pack/release gate thật.
