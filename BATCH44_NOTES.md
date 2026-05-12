# Batch44 — Product Trust, Account Security & Lesson Review Foundation

## Mục tiêu
Batch44 tập trung vào trust trước khi làm đẹp UI hoặc thêm tính năng thương mại: account/security foundation, content safety gate, lesson review gate và legal asset foundation. Batch này không thêm AI, không thêm API model, không thêm thanh toán thật, không tạo dữ liệu verified giả.

## Audit trước nâng cấp
- Repo Batch43 đã có checklist chất lượng, export compliance packet, coverage truth và operating foundation.
- `/api/generate` vẫn là template/data-based, không thấy SDK/call OpenAI/Gemini/Anthropic.
- Lỗ hổng đáng ưu tiên: `versions`, `workflow/history`, `versions/compare` trả dữ liệu theo lesson id mà chưa kiểm tra session/quyền đọc.
- Login demo đã downgrade role yêu cầu không phải teacher khi auto-provision, nhưng người biết đúng tên membership `Tổ trưởng demo`/`Quản trị demo` vẫn có thể khớp membership quyền cao.
- Tạo giáo án vẫn có thể dùng seed/starter để sinh nội dung khá đầy đủ nếu policy setting đang để thấp. Điều này dễ bị hiểu nhầm thành nội dung đủ tin cậy.
- Review/approve route đã có governance check khi approve nhưng chưa dùng chung trust gate để chặn thiếu provenance khi gửi duyệt.

## Thay đổi chính

### 1. Account/security foundation
- Thêm `lib/route-security.ts` để dùng chung `requireLessonRouteAccess()` và bounded text input.
- Chặn route nhạy cảm:
  - `app/api/lessons/[id]/versions/route.ts`
  - `app/api/lessons/[id]/workflow/route.ts`
  - `app/api/lessons/[id]/versions/compare/route.ts`
- Route login dùng `parseBoundedText`, cookie có `secure` khi production.
- `resolveMembershipForLogin()` không còn cấp phiên leader/admin chỉ bằng việc nhập đúng tên membership. Muốn đăng nhập quyền cao phải có `GIAOAN_PRIVILEGED_LOGIN_CODE`; thiếu code thì session bị downgrade xuống teacher.
- `.env.example` thêm biến `GIAOAN_PRIVILEGED_LOGIN_CODE`.

### 2. Lesson trust/review gate
- Thêm `lib/lesson-trust-gates.ts`.
- `POST /api/lessons` và `PUT /api/lessons/[id]` dùng trust gate trước khi cho `review` hoặc `approved`.
- `POST /api/lessons/[id]/reviews` dùng trust gate khi reviewer muốn chuyển sang `review` hoặc `approved`.
- Gate chặn các tình huống:
  - checklist còn blocker;
  - thiếu governance/provenance snapshot;
  - thiếu source references;
  - approved khi governance policy không đạt.
- Nguồn `seed` chỉ được cảnh báo ở bước review, nhưng bị blocker ở bước approved.

### 3. Content safety gate cho generator
- Thêm `lib/content-safety-gate.ts`.
- `/api/generate` vẫn kiểm tra teaching policy như cũ, nhưng sau đó áp thêm content safety gate.
- Nếu scope chỉ là seed/internal_preview/starter hoặc thiếu reference/evidence, response chuyển sang `safe_skeleton`:
  - chỉ tạo khung kỹ thuật an toàn;
  - không trả câu hỏi/rubric/worksheet/lessonFlow chi tiết từ seed như nội dung dùng ngay;
  - plan có cảnh báo rõ giáo viên/tổ chuyên môn phải bổ sung và kiểm chứng.

### 4. Legal asset foundation
- Thêm `lib/legal-asset-library.ts`.
- Thêm `data/legal-assets.json` rỗng.
- Có normalizer và readiness gate cho asset/học liệu: source, author, license, attribution, quyền thương mại/chỉnh sửa, trạng thái duyệt.
- Chưa làm upload UI hoặc asset manager runtime để tránh nửa vời.

### 5. Validation script
- Thêm `scripts/validate-product-trust-account-security.ts`.
- Thêm npm script `product:trust-security-validate`.
- Script kiểm tra bằng source-level assertions: privileged login gate, secure cookie, route access guards, trust gate, content safety gate, legal asset foundation.

## Chưa làm trong batch này
- Chưa thêm đăng ký email/password thật, OAuth, xác minh email hoặc password hashing.
- Chưa thêm CSRF token hoàn chỉnh.
- Chưa thêm rate limit runtime thật.
- Chưa mở cộng đồng public/marketplace.
- Chưa thêm thanh toán thật.
- Chưa thêm AI.
- Chưa tạo verified content giả.
- Chưa refactor lớn `components/workspace.tsx`.

## Cách verify đề xuất
```bash
npm install
npm run typecheck
npm run product:trust-security-validate
npm run lesson:quality-validate
npm run export:compliance-validate
npm run coverage:truth-validate
```

Nếu không cài được dependency trong môi trường hiện tại, ít nhất audit source-level các file trên và chạy lại trong môi trường dev có `node_modules` đầy đủ.
