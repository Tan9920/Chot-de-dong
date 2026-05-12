# Batch89 — Core Flow UI/UX Guard + Serverless CSRF Fallback

Ngày: 2026-05-01

## Lý do chọn batch
Sau Batch88, repo đã có feedback evidence dossier và expansion gate, nhưng prompt UI/UX chỉ ra hai blocker cần ưu tiên trước khi thêm tính năng mới:

1. Luồng tạo giáo án có thể bị chặn bởi lỗi `/api/auth/csrf failed` trên demo thật.
2. Giao diện giáo viên quá dài, quá kỹ thuật, bắt tự gõ nhiều trường đáng lẽ phải cho chọn, và chưa có điều hướng mobile/desktop rõ.

Batch89 không mở community lớn, không thêm AI và không thêm thanh toán. Batch này tập trung vào luồng lõi: chọn thông tin -> tạo khung -> editor hiện nội dung -> lưu/xuất/gửi feedback.

## Thay đổi chính

### 1. CSRF/session fallback cho demo host/serverless
- `app/api/auth/csrf/route.ts` không để lỗi ghi JSON/session/audit làm chết route cấp CSRF token.
- `lib/auth.ts` có fallback `anonymous_demo_cookie_fallback` cho cookie demo teacher, chỉ role teacher, không admin.
- `lib/storage.ts`, `lib/security-audit-log.ts`, `lib/demo-feedback-intake.ts` chuyển ghi JSON sang best-effort/memory fallback nếu host không cho ghi `data/*.json`.

Mục tiêu: tránh lỗi phiên làm việc chặn luồng tạo giáo án demo. Đây không phải DB production.

### 2. UI giáo viên dễ dùng hơn
- Form chọn môn/nguồn/bài/mẫu/thời lượng chuyển sang dropdown theo catalog khi có dữ liệu.
- Vẫn có nhánh tự nhập chủ đề; nếu catalog thiếu, hệ thống chỉ dựng khung an toàn.
- Lỗi kỹ thuật như CSRF được dịch sang câu giáo viên hiểu.
- Sau khi tạo khung, editor tự scroll/focus để giáo viên thấy nội dung ngay.
- Desktop có sidebar điều hướng nhanh.
- Mobile có bottom tab: Soạn bài, Bản nháp, Xuất file, Góp ý, Cá nhân.
- Các panel kỹ thuật/admin/debug chỉ hiện khi chọn chế độ Nâng cao.

### 3. Giữ nguyên ranh giới an toàn
- Không thêm AI/API AI/model/agent.
- Không thêm payment thật.
- Không tạo dữ liệu verified giả.
- Không public cộng đồng tự do.
- Không copy SGK/tài liệu bản quyền.
- Không claim production-ready; không production-ready.

## Source-level / scaffold
- CSRF fallback mới là source-level; cần test trên Vercel thật với cookie/same-origin/CSRF.
- UI responsive mới là source-level; chưa có browser/mobile QA thật.
- JSON memory fallback chỉ dùng demo; production cần DB, locking, backup, migration.
- Dropdown catalog phụ thuộc `metadata.curriculum`; nếu registry thiếu dữ liệu, vẫn chỉ tự nhập và tạo safe skeleton.

## Lệnh kiểm tra chính

```bash
npm run core-flow-uiux:validate
npm run source:validate
npm run data:validate
npm run typecheck
npm run build:clean
GIAOAN_SMOKE_MODE=production npm run live:smoke:clean
GIAOAN_DEMO_URL=https://your-demo-domain npm run hosted:url-smoke
```

## Không production-ready / không production-ready
Batch89 cải thiện luồng lõi và UI/UX teacher-friendly ở source-level. Chưa đủ để nói production-ready nếu chưa pass install, build, live smoke, hosted URL smoke, mobile QA và export thật.
