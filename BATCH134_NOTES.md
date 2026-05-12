# Batch134 — Lovable Plan UI/Feature Bridge

## Mục tiêu
Thêm các tính năng và giao diện nổi bật từ file kế hoạch `ke-hoach-hoc-main.zip` vào repo chính `giao-an-mvp-vn-batch133-public-rollout-readiness-control-center.zip` mà không đổi stack, không kéo thêm dependency UI nặng và không phá các hard gate cũ.

## Đã làm trong code thật
- Thêm tab `Lịch tuần` để tạo cảm giác weekly teaching workspace: xem bài cần chuẩn bị, bài đã chuẩn bị, nhân bản bài cũ, ghi chú sau tiết.
- Thêm tab `Học liệu`: hoạt động lớp học, trò chơi khởi động, phiếu học tập, slide dàn ý, rubric, câu hỏi kiểm tra; có tìm kiếm, tab lọc, nhãn nguồn/license/trạng thái.
- Tách `Cộng đồng` khỏi `Học liệu`: cộng đồng là khu vực chia sẻ có kiểm duyệt, không tự public.
- Thêm tab `Kiểm duyệt`: hàng đợi moderator, lọc chờ duyệt/cần sửa, mở chi tiết, duyệt/yêu cầu sửa/từ chối/takedown dạng source-level UI.
- Thêm tab `Legal Gate` và `Release Gate` theo tinh thần file kế hoạch nhưng vẫn giữ trạng thái chặn khi thiếu bằng chứng.
- Thêm card dashboard `Batch134 · Giao diện từ file kế hoạch`, quick stats và quick actions.
- Bổ sung CSS cho hero/card/grid/list để giao diện gần phong cách Lovable hơn nhưng vẫn không cần `lucide-react`, Radix, TanStack Router hay Tailwind v4.
- Thêm validator `scripts/validate-batch134-lovable-plan-bridge-source.mjs` và scripts `batch134:lovable-plan-bridge-validate`, `smoke:batch134`, `verify:batch134`.

## Không làm / giữ an toàn
- Không thêm AI/API AI.
- Không thêm thanh toán Stripe/PayPal.
- Không nâng seed/scaffold thành verified.
- Không tuyên bố production-ready hoặc public rollout ready.
- Không chuyển sang TanStack/Lovable stack; chỉ port ý tưởng giao diện/tính năng vào Next.js hiện tại.

## Trạng thái thật
Đây là source-level UI/feature bridge. Một số dữ liệu trong Lịch tuần/Học liệu/Kiểm duyệt là mẫu để demo luồng sản phẩm. Cần batch backend sau để lưu lịch tuần thật, tài nguyên thật, audit log thật và quyền moderator thật.
