# BATCH78 — Type/Build Readiness & Dependency Hygiene

Mục tiêu: xử lý các vấn đề rắc rối đang chặn kiểm chứng thật: lockfile, npm auth/config hygiene, source validator runner, live HTTP smoke script, module rỗng và một số type-surface mismatch trong các foundation modules.

## Làm thật
- Thêm package-lock bằng package-lock-only.
- Làm sạch .npmrc ở mức repo: registry public, always-auth=false, không chứa token.
- Thêm source:validate runner.
- Thêm live-http-smoke script có kiểm tra thiếu dependencies, không smoke giả.
- Thêm source compatibility declarations để tsc có thể phân biệt lỗi source nội bộ khi môi trường chưa cài được node_modules.
- Bổ sung module public-trust-policy, release-signoff-board, release-signoff-workflow thay vì để file rỗng/not module.
- Làm mềm một số foundation helper để route cũ không vỡ vì sai số tham số.
- Không thêm AI, không thêm payment thật, không tạo verified giả.

## Chưa được claim
- Không production-ready.
- npm ci vẫn cần chạy lại ở máy/host có mạng và npm auth sạch.
- npm run typecheck và npm run build vẫn phải chạy lại sau khi dependency cài đủ.
- live HTTP smoke cần chạy lại trên host thật.

## Script markers
- source:typecheck
- live HTTP smoke
- package-lock
