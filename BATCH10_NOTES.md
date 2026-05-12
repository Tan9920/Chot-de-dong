# Batch 10 — verified content workflow cho pipeline học thuật

## Mục tiêu batch
Đợt này **không vá lẻ UI**. Trọng tâm là kéo một cụm lớn xuyên suốt cho dữ liệu học thuật:
- phân biệt rõ `seed` / `reviewed` / `verified`
- chuẩn hóa `sourceMeta` và `references`
- siết import manifest để có `sourceDefaults` + `scopeDefaults`
- siết review / publish flow để nội dung học thuật không publish khi còn `seed/demo`
- chuẩn bị đường DB-first thật cho topic / program / question / rubric / resource

## Những gì được nâng thật
1. **Type system & schema**
   - `DataSourceStatus` mở rộng thành `seed | reviewed | verified`
   - thêm `ContentSourceReference`
   - mở rộng `TopicSourceMeta` với references / reviewedBy / verifiedBy
   - thêm `sourceMeta` cho program / question / rubric / resource
   - Prisma schema được mở rộng provenance fields đồng bộ cho content tables

2. **Repository & runtime import**
   - DB mapper/runtime save-load đã đọc/ghi provenance fields cho:
     - topic
     - program distribution
     - question bank
     - rubric bank
     - shared resource
     - lesson template
   - Curriculum summary / overview / roadmap có thống kê source status tốt hơn

3. **Admin workflow**
   - review approved cho nội dung học thuật có thể nâng source status lên `reviewed`
   - publish chặn nếu content học thuật còn `seed/demo`
   - thêm route admin để đổi source status:
     - `POST /api/admin/content/:entity/source-status`
   - log audit mới:
     - `source_reviewed`
     - `source_verified`
     - `source_reset`

4. **Admin UI**
   - hiển thị badge source status
   - hiển thị refs count + source label
   - có nút:
     - đánh dấu reviewed
     - đánh dấu verified
     - reset seed
   - import manifest editor mặc định theo mẫu workflow mới

5. **Workspace UI**
   - hiển thị reviewed / verified rõ hơn trong overview và roadmap
   - nhấn mạnh rằng phần lớn dữ liệu hiện tại vẫn là seed/demo

## Điều batch này KHÔNG làm
- Không biến dữ liệu lớp 6 thành dữ liệu học thuật chuẩn chính thức
- Không nhập kho verified thật hàng loạt
- Không chạy migration DB thật trong môi trường artifact này
- Không hoàn tất hard multi-tenant theo production school deployment

## Ghi chú verify
Đã verify được:
- audit repo thật
- TypeScript compile (`tsc --noEmit`) sau khi sửa
- đối chiếu file thay đổi so với batch 9 gốc

Chưa verify được đầy đủ trong môi trường artifact này:
- `npm run dev`
- `next build`
- Prisma generate / migrate / db push
- các script cần local dependency đầy đủ như `tsx`

## Cảnh báo dữ liệu
Batch này **củng cố workflow và provenance**, không được diễn giải thành việc lớp 6 đã có nội dung chuẩn chính thức.
