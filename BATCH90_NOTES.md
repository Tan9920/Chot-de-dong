# BATCH90 — App-like Navigation Shell UIUX

## Mục tiêu

Batch90 xử lý feedback: màn dưới nên giống app hơn, có tab gọn, có Cài đặt riêng, tránh kéo trang dài và tránh nhồi quá nhiều trường phụ vào màn soạn bài.

## Thay đổi chính

- Thêm `WorkspaceTab` và `activeTab` để điều hướng app-like trong workspace.
- Mobile bottom tab chuyển thành 6 tab: Soạn, Sửa, Nháp, Xuất, Góp ý, Cài đặt.
- Desktop sidebar chuyển từ link cứng sang navigation rail có trạng thái active.
- Tách `Xuất file` thành panel riêng để giáo viên trên điện thoại không phải tìm nút trong editor.
- Tách `Cài đặt bài dạy` thành panel riêng: chế độ giao diện, sĩ số, thiết bị, không gian, ghi chú an toàn.
- Màn Soạn bài gọn hơn: tập trung vào lớp, môn, nguồn/bộ sách, chủ đề, mẫu, thời lượng, mục tiêu và mức học sinh.
- Mobile ẩn panel không thuộc tab đang chọn bằng `mobileVisibility`; desktop vẫn xem đầy đủ hơn.
- Gợi ý thiết kế/phân hóa và các panel kỹ thuật phụ được giữ cho desktop/chế độ nâng cao, không đè lên flow mobile.

## Không làm

- Không thêm AI/API model/SDK.
- Không thêm thanh toán thật.
- Không thêm marketplace tiền mặt/quỹ tiền mặt/referral nhiều tầng.
- Không tạo dữ liệu verified giả.
- Không claim production-ready.

## Verify hiện tại

Batch90 có validator source-level: `npm run app-shell-uiux:validate` hoặc chạy trực tiếp `node scripts/validate-batch90-app-shell-uiux-source.mjs`.

Cần chạy lại trên host thật:

```bash
npm run source:validate
npm run app-shell-uiux:validate
npm run typecheck
npm run build:clean
GIAOAN_DEMO_URL=https://your-vercel-domain.vercel.app npm run hosted:url-smoke
```

## Rủi ro còn lại

- Chưa chứng minh mobile browser QA thật.
- Chưa chứng minh Vercel build/live smoke.
- Chưa chứng minh export DOCX/PDF runtime trên host thật.
- Tab nhiều mục có thể vẫn hơi chật với màn rất nhỏ; cần test trên máy Android thật.

Ghi chú marker kiểm định: không thêm AI; không production-ready.
