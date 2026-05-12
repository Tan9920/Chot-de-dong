<!-- 
- không tạo kiến thức giả | không production-ready -->
# Batch55 — Compliance-by-Design & Public Trust Hardening

Ngày: 27/04/2026

Batch55 không cố hoàn thiện bằng cách tạo thêm kiến thức sâu hoặc dữ liệu giả. Trọng tâm là làm nền tảng đáng tin hơn khi giáo viên, tổ chuyên môn, phụ huynh hoặc nhà trường nhìn vào: hệ thống phải minh bạch trạng thái nguồn, không nói quá, không tự nhận verified/chính thức khi chưa đủ review, và không public nội dung/học liệu khi còn rủi ro pháp lý.

## Mục tiêu

- Không tạo kiến thức giả để lấp chỗ trống dữ liệu lớp 1–12.
- Không gọi seed/scaffold là reviewed/verified.
- Không dùng claim quảng cáo quá mức như “chuẩn Bộ”, “đúng 100%”, “dùng ngay không cần sửa”, “không vi phạm gì cả”.
- Gắn nhãn rõ: safe teacher frame, teacher review required, reviewed reference candidate, verified release candidate.
- Chặn public publish/school release nếu thiếu verified source, reference, field evidence, legal readiness hoặc có takedown/copyright blocker.
- Nhắc rõ giáo viên/tổ chuyên môn phải kiểm tra nguồn, nội dung, học liệu, license và bối cảnh lớp học trước khi dùng chính thức.
- Tiếp tục không thêm AI, không thêm billing thật, không tạo dữ liệu verified giả.

## File mới

- `lib/public-trust-policy.ts`
- `app/api/public-trust/readiness/route.ts`
- `scripts/validate-public-trust-policy.mjs`
- `scripts/smoke-batch55-public-trust-source.mjs`
- `scripts/verify-batch55-source.mjs`
- `BATCH55_NOTES.md`

## File sửa

- `lib/teacher-lesson-frame.ts`
- `app/api/lesson-frame/readiness/route.ts`
- `package.json`
- `components/workspace.tsx`

## Nâng cấp chính

### 1. Public trust policy

`lib/public-trust-policy.ts` thêm hàm:

- `evaluatePublicTrustReadiness()`
- `buildPublicTrustPolicyLines()`

Policy đánh giá theo các thao tác:

- `generate_lesson`
- `export_docx`
- `export_pdf`
- `share_to_community`
- `publish_public`
- `school_release`
- `marketing_display`

Policy trả về:

- decision: allowed / allowed_with_warnings / blocked;
- label: safe_teacher_frame / teacher_review_required / reviewed_reference_candidate / verified_release_candidate;
- canPresentAsVerified;
- canPubliclyPublish;
- mustShowSafeFrameWarning;
- mustKeepWatermarkOrDisclaimer;
- allowedClaims;
- forbiddenClaims;
- requiredDisclosures;
- teacherResponsibilities;
- legalResponsibilities;
- issues.

### 2. Chặn claim quảng cáo quá mức

Các claim bị policy chặn hoặc bắt buộc sửa:

- “chuẩn Bộ” khi chưa đủ căn cứ;
- “chính thức” khi chưa phải phát hành được duyệt thật;
- “đúng 100%”;
- “dùng ngay không cần sửa”;
- “không vi phạm gì cả”;
- “AI tạo giáo án chuẩn”;
- “thay giáo viên”;
- seed/scaffold bị gọi là verified.

### 3. Gate public/school release nghiêm hơn

- `publish_public` yêu cầu nguồn verified, reference và field evidence đủ rõ, không có legal blocker.
- `school_release` yêu cầu sourceStatus=verified, releaseTier=verified_release, supportLevel=operational.
- Tài nguyên có copyright risk unknown/high, legal asset chưa ready hoặc active takedown claim sẽ bị blocker.

### 4. Route kiểm tra public trust

Thêm `POST /api/public-trust/readiness`:

- Có `assertRuntimeRateLimit()`.
- Có `assertWriteProtection()`.
- Có `requireActiveSession()`.
- Có `readJsonBody()`.
- Đọc topic thật từ repository.
- Phân tích academic trace.
- Trả về public trust report.
- Ghi audit log `public_trust_readiness_check`.

### 5. Khung giáo án hiển thị minh bạch hơn

`lib/teacher-lesson-frame.ts` giờ đưa public trust board vào khung giáo án, để giáo viên thấy rõ:

- nhãn tin cậy;
- decision theo thao tác;
- claim được phép nói;
- claim bị cấm;
- disclosure bắt buộc;
- trách nhiệm giáo viên/tổ chuyên môn;
- trách nhiệm nguồn/license/takedown.

## Validator/smoke mới

Thêm scripts:

```bash
npm run public:trust-validate
npm run smoke:batch55
npm run verify:batch55
```

## Giới hạn thật sau Batch55

Batch55 vẫn không production-ready vì các điểm sau chưa được chứng minh trong môi trường audit:

- npm install ổn định;
- typecheck thật;
- build thật;
- Prisma generate/db push;
- Next server runtime;
- HTTP smoke thật với cookie/session/CSRF;
- UI đầy đủ cho public trust/admin legal review;
- tư vấn pháp lý thật từ luật sư hoặc reviewer pháp lý.

Đây là source-level hardening, không phải xác nhận pháp lý tuyệt đối. Code giúp giảm rủi ro và buộc minh bạch, nhưng không thể tự đảm bảo “không vi phạm gì cả”.

## Câu cảnh báo bắt buộc giữ nguyên

- Không tạo kiến thức giả.
- Nếu dữ liệu chỉ là seed/scaffold, hệ thống chỉ dựng khung an toàn cho giáo viên tự hoàn thiện.
- Repo sau Batch55 vẫn không production-ready nếu chưa verify được install, typecheck, build, Prisma và runtime thật.
