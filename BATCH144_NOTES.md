# Batch144 — P0/P1 Local Build Closure

## Mục tiêu

Giải quyết blocker lớn nhất còn lại sau Batch143: build production bị hiểu như treo ở `Collecting page data` trong cửa sổ tool ngắn, làm P0/P1 local chưa thể đóng trung thực.

## Thay đổi chính

- Guarded build xoá `.next` trước khi chạy để artifact bắt buộc thuộc current run, không thể dùng nhầm build output cũ.
- Raw build diagnostic cũng xoá `.next` trước khi chạy và ghi `buildOutputCleanup` vào artifact.
- P0/P1 local evidence runner thêm gate bắt buộc `raw_build_diagnostic`.
- P0/P1 local evidence report chỉ pass raw build khi `ok === true`, `rawNextBuildExitCode === 0`, `buildOutputCleanup.removed === true` và manifest bắt buộc tồn tại.
- P0/P1 final closure board/report thêm gate raw build trực tiếp để tránh claim local closure khi raw build chưa chứng minh exit 0.
- Thêm validator Batch144 để chặn hồi quy source-level.

## Phạm vi không đổi

- Không thêm AI.
- Không thêm payment.
- Không tạo verified giả.
- Không auto-public community.
- Không gọi P0/P1 public/hosted hoàn thành nếu thiếu Node24 GitHub Actions, hosted APP_URL, visual smoke screenshot thật, production DB/security/legal review.

## Claim được phép

Nếu các lệnh local pass, có thể nói: `Local/source P0/P1 closed candidate` hoặc `P0/P1 local proof đã đóng trong môi trường local hiện tại`.

Không được nói: `production-ready`, `public rollout ready`, `P0/P1 hoàn thành tuyệt đối`, hoặc `100%`.
