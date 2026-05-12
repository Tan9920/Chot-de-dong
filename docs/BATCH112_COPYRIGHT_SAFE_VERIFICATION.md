# Batch112 — Legal/Copyright-Safe Academic Verification Pipeline

## Phạm vi

Batch112 chỉ nâng phần pháp lý/bản quyền cho lộ trình Verified học thuật thật 1–12. Không mở UI/UX, AI, payment, marketplace, cộng đồng public rộng, hoặc runtime closure.

## Đã tìm hiểu trước khi nâng cấp

Nguồn đã đưa vào policy:

- Luật Sở hữu trí tuệ 50/2005/QH11 và các sửa đổi liên quan.
- Nghị định 17/2023/NĐ-CP về quyền tác giả, quyền liên quan.
- Nghị định 134/2026/NĐ-CP sửa đổi/bổ sung một số điều của Nghị định 17/2023/NĐ-CP.
- Thông tư 32/2018/TT-BGDĐT về Chương trình giáo dục phổ thông.
- Thông tư 17/2025/TT-BGDĐT sửa đổi/bổ sung một số nội dung trong CTGDPT.

Các nguồn này không được hiểu là app được phép copy SGK/sách giáo viên. Chỉ dùng làm metadata/source spine/current-law check.

## Non-negotiables

- Không copy dài SGK, sách giáo viên, giáo trình, sách tham khảo, đề thi thương mại, ảnh/học liệu có bản quyền.
- Không dựa vào ngoại lệ giảng dạy/cá nhân để public nội dung trong web/app có gói trả phí hoặc phân phối đại trà.
- Không dùng “trích dẫn hợp lý” để tạo lại bài đọc, đề, đáp án, ảnh, bảng biểu hoặc đoạn dài.
- Chỉ lưu metadata, mapping, locator nguồn, mô tả ngắn, trích yếu ngắn thật sự cần thiết, hoặc nội dung giáo viên/trường sở hữu quyền sử dụng.
- Mọi tài nguyên public/export cần license, attribution, permissionBasis, takedownContact, legalCheckStatus, reviewer signoff.
- Thiếu gate pháp lý thì safe_frame_only; không reviewed, không verified, không contentDepthAllowed.

## File mới

- `data/academic-copyright-compliance-policy.json`
- `data/academic-copyright-compliance-dossier.json`
- `lib/academic-copyright-compliance.ts`
- `app/api/academic/copyright-compliance/route.ts`
- `app/api/admin/academic-copyright-compliance-board/route.ts`
- `scripts/academic-copyright-compliance-report.mjs`
- `scripts/validate-batch112-copyright-compliance-source.mjs`
- `docs/BATCH112_COPYRIGHT_SAFE_VERIFICATION.md`
- `BATCH112_NOTES.md`

## File sửa

- `package.json`
- `package-lock.json`
- `scripts/run-source-validators.mjs`

## Trạng thái thật

Batch112 tạo legal/copyright compliance pipeline. Nó không phải tư vấn pháp lý chính thức và không chứng minh production-ready. Không tạo verified giả, không bật contentDepthAllowed, không public tài nguyên cộng đồng.

## Cách chạy

```bash
npm run academic:copyright-compliance-validate
npm run academic:copyright-compliance-report
npm run smoke:batch112
npm run typecheck
```

`verify:batch112` vẫn có thể fail ở `next:swc-ready/build/live smoke` nếu môi trường thiếu dependencies/registry như các batch trước.
