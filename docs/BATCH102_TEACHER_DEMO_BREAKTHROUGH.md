# Batch102 — Teacher Demo Breakthrough & Acceptance Gate

Batch102 là batch bứt phá demo có kiểm soát, không phải batch production-ready.

## Vì sao batch này cần thiết

Các vấn đề lặp lại trước đây không chỉ là UI xấu. Vấn đề gốc là:

1. giáo viên khó bắt đầu vì phải tự gõ lớp/môn/bài;
2. UI có thể đẹp nhưng chưa nói rõ dữ liệu nào chỉ là seed/scaffold;
3. save/export có guard nhưng giáo viên không thấy quota/trạng thái vận hành;
4. project nhiều lần chưa đóng được install/build/runtime/hosted smoke;
5. nếu không có một acceptance gate tổng hợp thì rất dễ overclaim.

## Phạm vi đã làm

- `/api/demo/breakthrough` trả về:
  - version;
  - batch name;
  - source checks;
  - blockers;
  - operating plan/quota snapshot;
  - runtime closure state;
  - launch gate state;
  - allowed/forbidden claims.
- Dashboard hiển thị `breakthrough-card` để người không chuyên vẫn hiểu:
  - source đã tốt đến đâu;
  - còn bao nhiêu điểm cần đóng;
  - không AI lõi.
- Tab tạo giáo án có `teacher-starter-grid`:
  - chọn nhanh lớp/môn/bài từ metadata catalog;
  - không bắt giáo viên phải tự viết ngay từ đầu;
  - vẫn cho tự nhập nếu chưa có dữ liệu.
- Tab export có `quota-strip`:
  - lượt lưu nháp còn lại;
  - DOCX còn lại;
  - PDF còn lại.

## Guardrails giữ nguyên

- Không thêm AI/API AI/model SDK/API key.
- Không thêm payment thật.
- Không thêm marketplace tiền mặt.
- Không thêm quỹ tiền mặt.
- Không thêm referral nhiều tầng.
- Không tạo verified giả.
- Không public community tự do khi chưa có moderation/review.
- Không claim dữ liệu 1–12 đã chuẩn/verified đầy đủ.

## Ranh giới thật

Batch102 chỉ làm bứt phá source-level và acceptance gate. Nó không thể tự sửa lỗi môi trường mạng như `EAI_AGAIN registry.npmjs.org`, không thể tự chứng minh build nếu máy chưa cài dependencies, và không thể thay browser/mobile QA thật.

Batch tiếp theo nên ưu tiên runtime closure: install sạch, Next SWC, build, live smoke, hosted smoke, browser QA.
