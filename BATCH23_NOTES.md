# Batch 23 — official source bridge + evidence scaffold

## Mục tiêu batch
Không thêm dữ liệu học thuật bừa. Tập trung vá đúng điểm nghẽn giữa:
- source bundle chính thống / legal-safe
- entity pack sinh từ registry 1–12
- field evidence / evidence ledger
- luồng quản trị để preview/apply bootstrap

## Những gì đã làm
- Tách một catalog nguồn chính thống dùng chung ở `lib/official-source-catalog.ts`.
- Chuẩn hoá 3 scope bundle cho mỗi pack:
  - `official_core`
  - `guidance`
  - `textbook`
- Mỗi scope giờ có:
  - ref canonical/legal-safe
  - `coverageTargets` theo field/entity
  - note giải thích phạm vi dùng
- `lib/source-bundles.ts` không còn sinh bundle trống hoàn toàn; template bundle mới đã có payload legal-safe mặc định.
- `lib/seed-pack-builder.ts` đã gắn cho entity seed/generated:
  - `referenceBundleIds`
  - `references`
  - `fieldEvidence` scaffold theo field
- `lib/evidence-ledger.ts` đã có fallback scaffold runtime:
  - nếu chưa có record persisted thì tự dựng ledger scaffold từ dataset pack hiện có
  - giúp workbench/report thấy đúng lỗ hổng evidence thay vì trả rỗng tuyệt đối
- Thêm API route quản trị:
  - `GET|POST /api/admin/content/official-source-bootstrap`

## Ý nghĩa thật của batch này
- Chưa biến corpus thành verified thật.
- Nhưng đã nối được khung kỹ thuật 1–12 với bundle nguồn chính thống/citation/evidence để các pack không còn “có source bundle nhưng entity không bám bundle”.
- Đây là bước để rollout nhiều lớp/môn tiếp theo theo hướng an toàn pháp lý thay vì tiếp tục seed rời rạc.

## Verify đã làm
- Audit trực tiếp repo batch22 rồi mới sửa.
- `tsc -p tsconfig.json --noEmit` pass sau các thay đổi chính.

## Chưa verify
- `next build`
- chạy UI/API end-to-end với dependency cài thật
- áp bundle bootstrap thật vào JSON/DB runtime production
- review học thuật thủ công từng pack
