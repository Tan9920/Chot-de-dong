# Batch54 — Teacher-Editable Safe Lesson Frame & Classroom Context Hardening

Date: 2026-04-27

## Scope

Batch54 continues after Batch53. It does **not** add AI, billing, marketplace cash flow, fake verified data, or deep subject generation. The goal is to make early-stage lesson drafting safer and more useful for real teachers by turning unverified/starter data into a stronger teacher-editable lesson frame instead of pretending the system has a fully verified 1–12 knowledge corpus.

This batch directly addresses the product/legal and teacher reference notes:

- Do not create deep subject knowledge when 1–12 data is not fully verified.
- If data is only seed/scaffold, create a safe frame and force teacher input.
- Lesson activities must adapt to class size, classroom space, device availability, learner level, and duration.
- Primary/THCS/THPT and weak/standard/advanced contexts need different guidance.
- Do not auto-generate Casio/handheld calculator guidance without approved data or teacher-provided content.
- Images/materials need source, license, attribution, moderation, and takedown safety.
- Early-stage target users are student teachers, new teachers, primary teachers, and teachers needing quick Word/PDF-ready frames.

## What changed in code

### 1. Teacher-editable safe lesson frame library

New file:

- `lib/teacher-lesson-frame.ts`

Main exports:

- `TeacherEditableFrameReadiness`
- `assessTeacherEditableFrameReadiness()`
- `buildTeacherEditableFrameLines()`
- `buildPhaseTeacherInputLines()`
- `buildSafeTeacherEditableLessonFrame()`

This library centralizes the rule that unverified/starter/scaffold data must produce a teacher-editable frame, not deep subject content. It also creates explicit checklist sections for:

- teacher must input/check;
- blocked auto-content;
- class context decisions;
- legal media requirements;
- calculator/Casio policy;
- Word/PDF export readiness.

### 2. Safe skeleton now delegates to the stronger teacher frame

Modified file:

- `lib/content-safety-gate.ts`

`safe_skeleton` output now uses `buildSafeTeacherEditableLessonFrame()`. This means the fallback plan is richer and more explicit: it tells the teacher exactly where to add verified content, how to adapt by context, and which content must not be generated automatically.

### 3. Normal generator now surfaces teacher completion board

Modified file:

- `lib/generator.ts`

The regular generated plan now includes:

- `XIV. KHUNG GIÁO VIÊN CẦN HOÀN THIỆN TRƯỚC KHI XUẤT / CHIA SẺ`

This is intentionally conservative. Even when a plan is generated from available data, the teacher still sees what must be checked before export/sharing.

### 4. Lesson frame readiness API

New file:

- `app/api/lesson-frame/readiness/route.ts`

`POST` endpoint:

- requires active session;
- has runtime rate limit;
- has same-origin/CSRF write protection;
- uses guarded JSON body read;
- loads topic/coverage/source trace;
- returns content safety status, teacher frame readiness, context profile, source trace, and frame lines.

This is foundation for UI modes like Dễ dùng / Tiêu chuẩn / Nâng cao without making the workspace more technical.

### 5. Validators and source smoke

New files:

- `scripts/validate-teacher-lesson-frame.mjs`
- `scripts/smoke-batch54-teacher-frame-source.mjs`
- `scripts/verify-batch54-source.mjs`

Modified file:

- `package.json`

New scripts:

- `lesson:teacher-frame-validate`
- `smoke:batch54`
- `verify:batch54`

## What this batch does not claim

Batch54 is not production-ready. It does not prove:

- `npm install` pass;
- `npm run build` pass;
- `npm run typecheck` pass;
- `npx prisma generate` pass;
- Next HTTP runtime smoke pass;
- DB-backed Prisma runtime pass.

It is a source-level/product-safety improvement. It reduces academic/legal risk in generated drafts but does not replace professional curriculum review.

## Suggested checks

```bash
npm run lesson:teacher-frame-validate
npm run smoke:batch54
npm run verify:batch54
npm run lesson:context-safety-validate
npm run verify:batch53
npm run verify:batch52
npm run lint
npm run typecheck
npm run build
npx prisma generate
```

## Remaining risks

- 1–12 data is still seed/starter/scaffold, not a verified corpus.
- Safe frame is stronger, but teacher/tổ chuyên môn still must verify content.
- No complete UI wizard yet for Dễ dùng / Tiêu chuẩn / Nâng cao.
- No true file upload/legal media scan yet.
- No HTTP runtime test yet for the new readiness route.
- JSON fallback and source-level checks do not prove production concurrency or DB migrations.
