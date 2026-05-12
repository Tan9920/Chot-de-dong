# BATCH92 STARTER DATA EXPANSION

Batch92 thêm starter topic catalog cho toàn hệ lớp 1–12 để luồng chọn dữ liệu không còn quá trống khi test demo.

## Dữ liệu mới

- `data/starter-curriculum-catalog.json`
  - 12 khối lớp.
  - 134 phạm vi lớp/môn.
  - 402 starter topic titles.
  - `sourceStatus=seed`.
  - `supportLevel=developing`.
  - `contentDepthAllowed=false`.

- `data/subject-data-registry.json`
  - Đồng bộ registry để coverage hiển thị có topic/program/resource/rubric starter.
  - Không có record nào được nâng thành `reviewed`, `verified`, hoặc `approved_for_release`.
  - Không có `approvedReferenceCount`.
  - Không bật Casio tự động.

- `data/activity-game-library.json`
  - Mở rộng starter activities để có ý tưởng hoạt động theo nhiều lớp/cấp.
  - Vẫn là seed/developing, visibility limited, cần source/license/review trước khi public.

## Wiring code

- `lib/starter-curriculum-catalog.ts` cung cấp `getStarterTopicTitles`, `listStarterCurriculumTopics`, `getStarterCurriculumStats`.
- `lib/subject-data-truth.ts` dùng starter catalog để build catalog/coverage/summary.
- `lib/content-repository.ts` trả starter topics cho `/api/metadata` và search.
- `components/workspace.tsx` đổi thông điệp từ data-paused sang starter data expanded.

## Giới hạn bắt buộc

Starter data chỉ giúp chọn nhanh và dựng khung. Nó không phải dữ liệu học thuật đã duyệt. Khi thiếu reviewed/foundation/approved references, generator phải giữ `safe_frame_only` và yêu cầu giáo viên nhập nội dung, câu hỏi, đáp án, học liệu từ nguồn hợp pháp.

## Không được claim

- Không claim “đủ dữ liệu 1–12”.
- Không claim “chuẩn Bộ”.
- Không claim “verified”.
- Không claim nội dung dùng ngay không cần sửa.
- Không claim production-ready nếu chưa build/runtime smoke.
