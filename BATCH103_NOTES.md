# Batch103 — Academic Coverage Truth & Verification Gate

Batch103 dồn trọng tâm vào điểm yếu lớn nhất hiện nay: dữ liệu học thuật verified 1–12.

## Chốt sự thật

- Registry hiện có 134 scope lớp/môn ở mức starter/developing để giáo viên chọn khi test.
- Không có scope nào được nâng lên verified/approved_for_release trong batch này.
- Không có scope nào được bật contentDepthAllowed nếu thiếu reviewed + foundation + approved references.
- Vì vậy batch này không làm tăng dữ liệu học thuật verified thật bằng cách giả lập. Batch này làm tăng năng lực đo, khóa rủi ro, và chuẩn bị workflow nhập-duyệt dữ liệu.

## Thay đổi chính

- Thêm `data/academic-verification-policy.json`.
- Thêm `data/academic-verification-queue.json`.
- Thêm `lib/academic-coverage-audit.ts`.
- Thêm `/api/academic/coverage-audit`.
- Thêm `/api/admin/academic-verification-board`.
- Generator gắn thêm academic verification gate vào trace và giáo án.
- UI có Academic Truth card để giáo viên thấy rõ scope hiện đang bị khóa ở chế độ khung an toàn.
- Thêm validator `scripts/validate-batch103-academic-coverage-source.mjs`.

## Không overclaim

Không claim production-ready, không claim dữ liệu học thuật 1–12 đã verified đầy đủ, không claim chuẩn Bộ, không claim giáo án đúng 100%.

## Batch tiếp theo gợi ý

Batch104 nên là Academic Source Pack Intake: tạo luồng nhập metadata nguồn, license/attribution, reviewer signoff, release gate và audit log để bắt đầu nâng một số scope thật từ seed/developing lên reviewed/foundation một cách có căn cứ.
