# Batch59 — Release Sign-off Ownership, Audience Isolation & Runtime Verification Closure

## Mục tiêu
Batch59 tiếp tục sau Batch58. Trọng tâm là harden release sign-off workflow ở tầng server-side, không thêm AI, không thêm billing thật, không tạo dữ liệu verified giả.

## Thay đổi chính

### 1. Ownership hardening cho `teacher_owner`
- `teacher_owner` không còn được coi là quyền luôn đúng chỉ vì có session.
- `recordReleaseSignOffDecision()` chặn target chưa xác định.
- Với `lesson_plan`, server đọc `data/saved-lessons.json` để kiểm tra `authorId`/`authorName` trước khi cho ký `teacher_owner`.
- Với `community_resource`, server đọc `data/community-resources.json` để kiểm tra tác giả; admin/moderator có quyền quản trị nội dung mới được ký thay.
- Leader chỉ được ký thay lesson trong cùng scope khi có `canReviewLessons`.

### 2. Audience/school/department isolation
- `buildReleaseSignOffTargetKey()` đã chuyển từ dạng `subjectType:target` sang dạng có audience và scope:
  - `subjectType:aud:<audience>|school:<schoolKey>|department:<departmentKey>|target:<identity>`
- GET/POST `/api/release-dossier/signoffs` dùng session scope làm fallback cho `schoolKey`/`departmentKey`.
- Readiness/export/community enforcement truyền scope vào `collectTrustedReleaseSignOffs()` để tránh reuse nhầm workflow `teacher_private` cho `school_internal`/`public_community`.

### 3. Supersede/hash prep
- Thêm `contentHash` vào target/workflow/enforcement flags để chuẩn bị bước sau: supersede/revoke sign-off khi nội dung lesson/resource thay đổi lớn.
- Chưa triển khai full content-hash comparison hoặc auto-supersede runtime.

### 4. Prisma prep
- `ReleaseSignOffWorkflowRecord` bổ sung `contentHash`.
- Thêm unique prep cho `targetKey` và index `audience/schoolKey/departmentKey/status`.
- Chưa khẳng định DB migration/generate pass nếu chưa chạy Prisma thật.

## File tạo mới
- `BATCH59_NOTES.md`
- `scripts/validate-release-signoff-ownership-scope.mjs`
- `scripts/smoke-batch59-release-signoff-scope-source.mjs`
- `scripts/verify-batch59-source.mjs`

## File sửa
- `lib/release-signoff-workflow.ts`
- `app/api/release-dossier/signoffs/route.ts`
- `app/api/release-dossier/readiness/route.ts`
- `lib/release-dossier-enforcement.ts`
- `prisma/schema.prisma`
- `package.json`

## Giới hạn còn lại
- Sign-off workflow vẫn JSON fallback, chưa DB-backed production.
- `contentHash` mới là prep; chưa có auto-supersede/revoke thật khi lesson/resource đổi nội dung.
- Chưa có UI reviewer/admin đầy đủ để ký/xem lịch sử.
- JSON fallback vẫn chưa có transaction/lock/immutable audit.
- Không thay thế được review chuyên môn/pháp lý thật; release dossier chỉ là gate vận hành.

## Lệnh kiểm tra mới
```bash
npm run release:signoff-scope-validate
npm run smoke:batch59
npm run verify:batch59
```
