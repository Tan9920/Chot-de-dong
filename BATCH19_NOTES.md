# Batch 19 - multi-grade rollout waves + bulk bootstrap 1-12

## Trọng tâm
- Chặn việc hệ thống chỉ tiếp tục xoay quanh lớp 6 ở tầng vận hành.
- Thêm lớp rollout đa lớp để các pack lớp 1-12 đều có execution plan và source bundle scaffold theo wave.
- Không tô hồng: đây vẫn là scaffold vận hành + nguồn, chưa phải verified corpus thật.

## Những gì đã nâng
- `lib/rollout-waves.ts`
  - quản rollout wave theo dải lớp/môn/pack
  - tóm tắt wave, resolve pack thực tế từ registry
  - build bootstrap kit đa lớp gồm execution scaffold + source bundle scaffold + evidence ledger scaffold
  - build rollout portfolio theo lớp để thấy lớp nào đã có execution/bundle/ledger
- `prisma/schema.prisma`
  - thêm model `AcademicRolloutWaveRecord`
- `lib/content-management.ts`
  - thêm:
    - `getAcademicRolloutWaveSummary()`
    - `previewAcademicRolloutWaveRegistryImport()`
    - `importAcademicRolloutWaveRegistry()`
    - `getAcademicRolloutBootstrapKit()`
    - `applyAcademicRolloutBootstrap()`
    - `getAcademicRolloutPortfolioSummary()`
- API mới:
  - `GET/POST /api/admin/content/rollout-waves`
  - `GET/POST /api/admin/content/rollout-bootstrap`
- Admin summary/report trả thêm:
  - `rolloutWaveSummary`
  - `rolloutPortfolio`
- Admin UI có thêm section:
  - `Multi-grade rollout waves`
- CLI mới:
  - `npm run content:rollout-wave-summary`
  - `npm run content:rollout-wave-import -- <file.json> [--apply]`
  - `npm run content:rollout-bootstrap -- [waveId]`
  - `npm run content:rollout-portfolio`

## Dữ liệu scaffold đã nạp sẵn
- `data/rollout-waves.json`
  - 3 wave:
    - Tiểu học 1-5
    - THCS 6-9
    - THPT 10-12
- `data/source-bundles.json`
  - đã prefill scaffold bundle cho toàn bộ 140 pack trong registry
  - tổng 420 bundle scaffold (official core / textbook / guidance)
- `data/pack-execution-registry.json`
  - đã prefill 140 execution scaffold cho toàn bộ pack 1-12 trong registry
- `data/imports/rollout-waves.sample.json`
  - sample import cho rollout waves

## Kiểm tra thực tế sau batch này
- Toàn bộ 140 pack trong registry đều đã có execution scaffold.
- Toàn bộ 140 pack trong registry đều đã có source bundle scaffold.
- Coverage theo lớp không còn dừng ở lớp 6 về mặt workflow scaffold.
- Evidence ledger toàn hệ vẫn chưa nạp hàng loạt mặc định; vẫn để bootstrap theo nhu cầu hoặc theo wave để tránh tạo cảm giác "đã verified" giả.

## Điều vẫn phải nói rõ
- Batch này không tạo verified corpus thật.
- Source bundles hiện là scaffold rỗng, chưa có tài liệu CTGDPT/SGK/hướng dẫn thật.
- Execution registry hiện là kế hoạch vận hành, chưa phải bằng chứng học thuật.
- Evidence ledger vẫn là bước tiếp theo nếu muốn audit field-level thật trên diện rộng.
