# Batch104 — Academic Source Pack Intake & Review Gate Foundation

Batch104 không vá lẻ UI và không nâng dữ liệu verified giả. Batch này tạo nền nhập-duyệt nguồn học thuật sau Batch103.

## Chốt sự thật

- Batch103 đã đo được 134 scope trong registry nhưng verified/approved = 0 và deepContentAllowed = 0.
- Batch104 giữ nguyên sự thật đó. Không đổi `subject-data-registry.json` để làm đẹp số liệu.
- Source pack draft trong `data/academic-source-pack-submissions.json` chỉ là template/intake queue, chưa phải nguồn được duyệt.

## Thay đổi chính

- Thêm `data/academic-source-intake-policy.json`.
- Thêm `data/academic-source-pack-submissions.json`.
- Thêm `lib/academic-source-intake.ts`.
- Thêm `/api/academic/source-intake` với GET board và POST dry-run evaluation.
- Thêm `/api/admin/academic-source-intake-board`.
- Gắn source intake summary vào generator appendix và breakthrough report.
- Thêm UI Source Intake card để giáo viên/admin hiểu: muốn nâng coverage thật phải có nguồn/license/reviewer/takedown.
- Thêm validator `scripts/validate-batch104-academic-source-intake-source.mjs`.

## Không overclaim

Không claim production-ready. Không claim dữ liệu học thuật 1–12 đã verified. Không claim source pack demo là nguồn hợp pháp. Không claim chuẩn Bộ/đúng 100%. Không thêm AI/API/model/agent.

## Batch tiếp theo gợi ý

Batch105 nên chỉ làm `First Reviewed Scope Release Dossier` nếu thật sự có source pack hợp pháp và reviewer signoff. Nếu chưa có bằng chứng thật, Batch105 nên quay lại đóng install/build/hosted runtime smoke.
