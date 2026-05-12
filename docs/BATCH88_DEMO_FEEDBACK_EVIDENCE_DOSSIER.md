# BATCH88 DEMO FEEDBACK EVIDENCE DOSSIER

Batch88 adds a controlled feedback intake and evidence board for the hosted demo. The purpose is to stop the team from sharing the link wider just because the source code has a demo gate.

## New routes

- `GET /api/demo/feedback`: public redacted feedback board and form config.
- `POST /api/demo/feedback`: CSRF/session/rate-limited feedback intake for controlled testers.
- `GET /api/admin/demo/feedback`: admin/reviewer route for redacted feedback review.

## P0/P1 control rule

- P0: demo cannot be opened, personal data risk, serious legal/academic issue, or severe runtime break. Stop sharing.
- P1: export, save, login, mobile or source-confusion issue that blocks normal test. Keep internal until triaged.
- P2: important usability or clarity issue. Continue only with small controlled group.
- P3: suggestion/minor wording. Does not block controlled testing.

Do not expand the demo if feedback board shows open P0/P1.

## Privacy rule

Do not send student names, faces, phone numbers, addresses, class lists, school IDs, or identifiable screenshots. Blur/delete student data first. The API rejects feedback marked as containing student personal data.

## Before expanding test

1. Vercel build passes.
2. Hosted URL smoke passes.
3. At least 3 valid teacher feedback submissions exist.
4. No open P0/P1.
5. At least one mobile test and one DOCX/PDF open-file check exists.
6. Safe sharing copy from tester pack is used.
7. The demo is still described as a controlled test, not production-ready.

## Commands

```bash
npm run demo:feedback-validate
npm run smoke:batch88
GIAOAN_DEMO_URL=https://your-domain.vercel.app npm run hosted:url-smoke
```

Batch88 does not add AI, payments, marketplace, cash fund, or fake verified data.

Ghi nhớ: không gửi dữ liệu cá nhân học sinh trong feedback hoặc ảnh bằng chứng.
