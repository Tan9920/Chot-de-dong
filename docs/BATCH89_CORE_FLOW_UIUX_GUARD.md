# BATCH89 CORE FLOW UIUX GUARD

Batch89 xử lý đúng vấn đề sau Batch88: demo có gate trung thực nhưng luồng giáo viên vẫn có thể bị chặn và UI còn quá kỹ thuật.

## Mục tiêu

- Không để CSRF/session/audit JSON write làm chết route `/api/auth/csrf` trên serverless host.
- Bấm “Thiết kế bài dạy” xong thì editor có nội dung và tự đưa người dùng tới vùng chỉnh sửa.
- Teacher UI dùng dropdown/catalog trước, tự nhập chỉ là nhánh phụ.
- Mobile có bottom tabs (mobile bottom tabs), desktop có sidebar.
- Admin/debug/governance sâu không hiện mặc định với giáo viên thường.

## CSRF fallback

`/api/auth/csrf` vẫn cấp token qua cookie. Nếu host demo không cho ghi `data/auth-sessions.json` hoặc `data/security-audit-events.json`, route vẫn trả token và tạo cookie demo teacher fallback. Fallback này chỉ là teacher role, không phải admin.

## Serverless JSON write fallback

Các file runtime JSON liên quan đến luồng chính được chuyển sang best-effort:

- `lib/storage.ts`
- `lib/security-audit-log.ts`
- `lib/demo-feedback-intake.ts`

Nếu ghi file fail, runtime giữ memory fallback ở process hiện tại hoặc để client fallback localStorage. Đây chỉ là demo guard, không thay DB production.

## Teacher-friendly UI

Workspace chuyển theo hướng:

1. Chọn lớp.
2. Chọn môn học từ catalog nếu có.
3. Chọn nguồn/bộ sách nếu có.
4. Chọn bài/chủ đề nếu có.
5. Nếu thiếu catalog, tự nhập chủ đề và chỉ tạo khung an toàn.
6. Chọn mẫu giáo án bằng dropdown.
7. Tạo khung, editor auto-scroll/focus.
8. Lưu, xuất DOCX/PDF hoặc gửi feedback.

## Mobile bottom tabs

Mobile hiển thị bottom tabs để giáo viên không phải kéo trang quá dài:

- Soạn bài
- Bản nháp
- Xuất file
- Góp ý
- Cá nhân

## Giới hạn

- Chưa chứng minh hosted runtime thật.
- Chưa chứng minh export DOCX/PDF mở tốt trên host.
- Chưa có mobile QA thật.
- Chưa có feedback giáo viên thật sau patch.
- Không production-ready.

## Không thêm

- Không thêm AI.
- Không thêm thanh toán thật.
- Không thêm marketplace/quỹ/referral nhiều tầng.
- Không tạo verified giả.
