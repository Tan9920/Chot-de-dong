# BATCH100 UX/GOVERNANCE POLISH

Batch100 là batch UI/UX + governance-source polish cho bản `b_XWG` sau khi đối chiếu baseline Batch98.

## Nâng cấp chính

1. **Mobile drawer closure**
   - Có nút đóng rõ ràng.
   - Có backdrop bấm ra ngoài.
   - Có Escape key.
   - Có `aria-controls`, `role="dialog"`, `aria-modal="true"`.
   - Khi mở drawer, `body.mobile-menu-open` khóa scroll nền.

2. **Teacher-safe flow banner**
   - Hiển thị “Luồng an toàn cho giáo viên”.
   - Hiển thị nhãn dữ liệu: đã rà soát / đã xem lại / bản mẫu thử / chỉ có khung.
   - Nhắc giáo viên kiểm tra nguồn và nội dung khi dữ liệu chưa verified.

3. **Guided progress**
   - 4 bước: chọn lớp/môn/bài → tạo khung an toàn → lưu bằng tài khoản giáo viên → checklist/xuất.
   - Giúp giáo viên không bị lạc trong workspace dày tính năng.

4. **Visible mode switcher**
   - Chế độ Dễ dùng / Tiêu chuẩn / Nâng cao xuất hiện trên desktop header và trong mobile drawer.
   - Phù hợp định hướng không làm giao diện quá kỹ thuật cho giáo viên.

5. **Safer export affordance**
   - `disableExportUntilContent` khóa nút xuất khi chưa có nội dung.
   - Export vẫn yêu cầu tài khoản giáo viên thật theo Batch95/98 server-side guard.

## Guardrails giữ nguyên

- Không thêm AI.
- Không thêm payment thật.
- Không tạo verified giả.
- Không mở cộng đồng public tự do.
- Không cho tự chọn admin/tổ trưởng khi đăng ký.
- Không claim production-ready khi chưa có npm install/build/live smoke/hosted smoke/browser QA.
