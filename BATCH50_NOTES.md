# Batch50 — Lesson Context Adaptation & Safety Guard Reinforcement

Ngày: 27/04/2026

## Mục tiêu

Batch50 không thêm AI, không thêm billing thật, không tạo dữ liệu verified giả. Mục tiêu là đưa góp ý product/legal và tham khảo giáo viên vào runtime soạn giáo án:

- Giáo viên chọn bối cảnh lớp học trước khi dựng giáo án: sĩ số, không gian lớp, thiết bị, mức học sinh và thời lượng.
- Generator điều chỉnh khung tổ chức hoạt động, phân hóa và đánh giá theo bối cảnh đó.
- Safe skeleton vẫn giữ bối cảnh lớp học nhưng không sinh kiến thức sâu nếu dữ liệu chưa đủ ngưỡng.
- Checklist chất lượng có thêm nhóm kiểm tra `context_fit` để phát hiện giáo án máy móc, thiếu điều kiện lớp học thực tế.
- UI thêm panel “Bối cảnh lớp học” theo hướng dễ hiểu, không quá kỹ thuật.

## Thay đổi chính

### Tạo mới

- `lib/lesson-context.ts`
  - Chuẩn hóa `LessonContextInput`.
  - Tạo `LessonContextProfile`.
  - Sinh gợi ý vận hành theo sĩ số/không gian/thiết bị/mức học sinh/thời lượng.
  - Có cảnh báo: không tự sinh kiến thức sâu, không tự thêm Casio/máy tính cầm tay, học liệu/ảnh cần nguồn/license/attribution/trạng thái duyệt.

- `scripts/validate-lesson-context-safety.mjs`
  - Validator source-level không cần `tsx`.
  - Kiểm tra generator, content safety, quality checklist, workspace và types đã nối context.

- `scripts/verify-batch50-source.mjs`
  - Parse JSON.
  - Scan source.
  - Chặn needle AI/API/model phổ biến.
  - Kiểm tra file Batch50 có mặt.

### Sửa

- `lib/types.ts`
  - Thêm type cho lesson context.
  - `GenerateLessonPayload` có `lessonContext`.
  - `GeneratedLessonBundle.summary` có `lessonContext`.
  - `GeneratedLessonBundle.trace` có `contentSafety` typed rõ hơn.
  - `LessonQualityDimension` thêm `context_fit`.

- `lib/generator.ts`
  - Tạo `lessonContextProfile` từ payload.
  - Thêm mục “Bối cảnh lớp học và cách tổ chức”.
  - Mỗi hoạt động có thêm điều chỉnh theo bối cảnh lớp học.
  - Đánh giá có thêm điều chỉnh theo bối cảnh và safety notes.
  - Summary trả về `lessonContext`.

- `lib/content-safety-gate.ts`
  - Safe skeleton plan giữ thông tin bối cảnh lớp học.
  - Khi dữ liệu chưa đủ ngưỡng, hệ thống vẫn chỉ tạo khung kỹ thuật an toàn và nhắc giáo viên chọn/kiểm tra bối cảnh.

- `lib/lesson-quality-checklist.ts`
  - Thêm `buildContextFitItems()`.
  - Checklist kiểm tra bối cảnh lớp học, điều kiện lớp học thực tế, và safety notes nguồn/Casio/license.

- `components/workspace.tsx`
  - Thêm panel “Bối cảnh lớp học”.
  - Người dùng chọn sĩ số, không gian, thiết bị, mức học sinh, thời lượng.
  - Payload gửi `lessonContext` vào `/api/template-builder`.

- `package.json`
  - Thêm script `lesson:context-safety-validate`.
  - Thêm script `verify:batch50`.

## Giới hạn thật

- Batch50 chỉ thêm điều chỉnh rule-based theo bối cảnh lớp học, không chứng minh nội dung kiến thức lớp 1–12 đã verified.
- Không tạo kho kiến thức sâu mới.
- Không thêm AI.
- Chưa verify build/lint/Prisma vì `npm install` vẫn timeout trong môi trường audit nếu dependencies chưa có.
- Cần runtime smoke thật trên Next server khi môi trường cài được dependencies.

## Lệnh kiểm tra ưu tiên

```bash
npm run lesson:context-safety-validate
npm run verify:batch50
npm run auth:lifecycle-validate
npm run route:hardening-validate
npm run verify:batch49
npm run verify:batch48
npm run typecheck
npm run lint
npm run build
npx prisma generate
```
