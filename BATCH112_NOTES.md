# BATCH112 NOTES — Legal/Copyright-Safe Academic Verification Pipeline

Mục tiêu: tiếp tục nâng Verified học thuật thật 1–12 nhưng khóa rủi ro bản quyền/pháp lý trước. Batch này đã tìm hiểu và ghi vào policy các nguồn pháp lý/curriculum hiện hành: Luật Sở hữu trí tuệ, Nghị định 17/2023/NĐ-CP, Nghị định 134/2026/NĐ-CP, Thông tư 32/2018/TT-BGDĐT và Thông tư 17/2025/TT-BGDĐT.

## Đã làm

- Thêm policy pháp lý/bản quyền riêng cho academic verification.
- Thêm dossier vận hành: checklist source pack, takedown workflow, pilot scopes vẫn bị chặn.
- Thêm library evaluateAcademicCopyrightCompliance để chặn nguồn thiếu license/attribution/permission/takedown/no-long-copy/current-law check.
- Thêm API dry-run `/api/academic/copyright-compliance`.
- Thêm admin board `/api/admin/academic-copyright-compliance-board`.
- Thêm report artifact `artifacts/academic-copyright-compliance-last-run.json`.
- Thêm validator Batch112.

## Không làm / không claim

- Không tạo verified giả.
- Không bật contentDepthAllowed.
- Không copy dài SGK/sách giáo viên/tài liệu bản quyền.
- Không dùng ngoại lệ giảng dạy/cá nhân để public sản phẩm thương mại.
- Không nói legal-ready = academic verified.
- Không nói source spine = được phép sinh nội dung sâu.
- Không claim production-ready hoặc tư vấn pháp lý chính thức.

## Trạng thái expected

- Registry mutations trong Batch112: 0.
- Fake verified/contentDepthAllowed: 0.
- Verified học thuật thật vẫn chưa tăng nếu chưa có source pack/reviewer/license thật.
- Nâng cấp tốt hơn ở chỗ: trước khi verified, mọi scope phải qua copyright gate rõ ràng.
