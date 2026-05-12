# Batch35 - legacy saved lesson governance backfill + validation gate

## Trọng tâm
Batch34 đã đưa compliance packet/release board vào cấp giáo án, nhưng dữ liệu `saved-lessons.json` cũ vẫn thiếu `governanceSnapshot`. Vì vậy compliance packet có thể rơi về snapshot mặc định trống, làm mất liên kết tới pack/source bundle dù repo đã có source metadata.

Batch35 xử lý lỗ hổng này ở tầng dữ liệu và vận hành:
- suy luận provenance cho giáo án legacy từ scope lớp/môn/bộ sách/chủ đề
- nối lại source references từ source bundle của pack tương ứng
- backfill snapshot cho giáo án đã lưu và các version cũ trong JSON seed
- thêm preview/apply API cho admin/leader có quyền quản trị nội dung
- thêm script CLI để preview/apply backfill
- thêm validation gate riêng cho lesson governance để phát hiện giáo án thiếu snapshot hoặc cần mapping thủ công

## Những gì đã thêm
- `lib/lesson-provenance-backfill.ts`
  - đọc registry pack 1–12 và source bundles từ `data/`
  - chấm điểm match theo grade/subject/book/topic
  - phân loại `already_present`, `exact_topic`, `scope_only`, `ambiguous`, `unmatched`
  - tạo `LessonGovernanceBackfillReport`
  - áp snapshot vào lesson + versions cũ
- `scripts/backfill-lesson-governance.ts`
  - mặc định preview
  - thêm `--apply` để ghi backfill qua storage/saveLesson
  - thêm `--json` để dùng trong CI hoặc audit artifact
- `scripts/validate-lesson-governance.ts`
  - báo giáo án thiếu snapshot nhưng backfillable
  - fail nếu có lesson cần manual mapping
  - `--strict` fail cả khi còn lesson backfillable nhưng chưa apply
- `app/api/admin/lessons/provenance-backfill/route.ts`
  - `GET`: preview report
  - `POST { apply: true }`: áp backfill cho lesson trong phạm vi user nhìn thấy
- `lib/types.ts`
  - thêm type report/item/action/match status cho lesson governance backfill
- `package.json`
  - thêm script `lesson:governance-backfill`
  - thêm script `lesson:governance-validate`

## Dữ liệu đã backfill trong JSON seed
- `local-seed-lesson-1` → `grade6-ngữ-van-foundation`, 8 source references
- `local-seed-lesson-2` → `grade6-toan-foundation`, 8 source references
- `local-seed-lesson-3` → `grade6-lich-sử-va-dia-li-foundation`, 9 source references

Sau backfill:
- 3/3 saved lessons có `governanceSnapshot`
- 4/4 saved lesson versions có `governanceSnapshot`

## Giới hạn cố ý
- Backfill không tự nâng `sourceStatus`, `releaseTier`, hoặc `supportLevel` lên mức cao hơn dữ liệu gốc.
- Các lesson vẫn bị compliance chặn official release vì source còn `seed` và release tier vẫn `internal_preview`.
- Backfill chỉ tạo hồ sơ truy vết tốt hơn, không biến seed/demo thành verified content.

## Verify trong container
- JSON data integrity check: pass
- Modified-file syntax transpile check bằng TypeScript API: pass cho các file Batch35 chính
- `npm install`: chưa hoàn tất trong container, timeout
- `tsc --noEmit`/`npm run typecheck`: chưa hoàn tất trong container, timeout
- `lint/build/data:validate`: chưa verify được vì dependency runtime (`next`, `tsx`) chưa cài xong
