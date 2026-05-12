# Batch109 — Offline Teacher Export & Printable Lesson Preview Polish

Batch109 tập trung vào đầu ra giáo viên nhìn thấy được sau khi Batch108 đã sửa đầu vào chọn lớp/môn/chủ đề. Mục tiêu là làm bản demo offline hữu ích hơn cho giáo viên phổ thông mà không cần npm/build và không vượt quá bằng chứng runtime hiện có.

## Phạm vi

1. Preview giáo án in được trong `public/teacher-pilot-demo.html`.
2. Tải bản nháp TXT để giáo viên copy/chỉnh nhanh.
3. Tải HTML in được để giáo viên mở lại hoặc in bằng trình duyệt.
4. Nút in/xuất PDF bằng trình duyệt, nhưng không claim PDF server-side.
5. Checklist an toàn trước khi dùng, viết bằng ngôn ngữ giáo viên hiểu.
6. Giữ Batch108 guard: không tạo `Tiếng Việt + Phân số`, không cho tự chọn `verified`, không sinh kiến thức sâu.

## Source-level only

Batch109 không chứng minh:

- npm install sạch;
- typecheck/build Next;
- live HTTP smoke;
- auth/session/cookie smoke;
- hosted URL smoke;
- DOCX/PDF server-side export runtime.

Vì vậy mọi báo cáo phải ghi rõ đây là source-level/offline artifact.

## Guardrails

- Không thêm AI.
- Không tạo verified giả.
- Không mở deep content cho seed/scaffold/custom_teacher_input.
- Không copy dài SGK/tài liệu bản quyền.
- Không dùng ảnh/học liệu thiếu source/license/attribution/approval status.
- Không public cộng đồng nếu chưa có moderation/review/takedown.

## File chính

- `public/teacher-pilot-demo.html`
- `data/teacher-pilot-print-export-policy.json`
- `lib/teacher-pilot-completion.ts`
- `app/api/teacher-pilot/completion/route.ts`
- `scripts/validate-batch109-offline-print-export-source.mjs`
- `scripts/teacher-print-export-report.mjs`

## Lệnh kiểm tra

```bash
npm run batch109:offline-print-export-validate
npm run teacher-pilot:print-export-report
npm run smoke:batch109
```

Các lệnh trên không thay thế `typecheck`, `build`, `live smoke`, `auth smoke`, hoặc `hosted URL smoke`.
