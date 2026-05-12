# BATCH91 — Teacher Workflow Guard + Data-Paused UIUX

## Mục tiêu
Batch91 nâng tiếp UIUX khi dữ liệu học thuật đang đứng im. Không thêm dữ liệu mới, không tạo verified giả, không thêm AI. Trọng tâm là làm workspace dễ hiểu hơn cho giáo viên khi demo vẫn chủ yếu kiểm tra flow.

## Thay đổi chính
- Thêm hướng dẫn theo tab đang mở: Soạn, Sửa, Nháp, Xuất, Góp ý, Cài đặt.
- Thêm nút mobile “Đi bước tiếp theo” để giáo viên không phải kéo trang dài.
- Thêm khối “Dữ liệu đang đứng im — vẫn test UI được” trong form Soạn bài.
- Thêm checklist data-paused: không thêm dữ liệu học thuật mới nếu chưa review thật; nếu thiếu bài/chủ đề thì chỉ tạo khung an toàn; không nâng seed/scaffold thành verified.
- Thêm empty editor state: nếu chưa có nội dung, UI hướng giáo viên quay về Soạn bài hoặc nhập tay.
- Cài đặt khuyên dùng Dễ dùng/Tiêu chuẩn khi dữ liệu đang đứng im; Nâng cao chỉ cho admin/dev.
- Giảm fallback lớp 6 ngầm khi mở saved lesson thiếu metadata: fallback về lớp 1, Tiếng Việt, nguồn giáo viên tự nhập.
- Bottom tab mobile có padding theo safe-area để đỡ bị sát đáy máy.

## Không làm
- Không thêm AI/API/model/prompt-agent.
- Không thêm payment thật, marketplace tiền mặt, quỹ tiền mặt, referral nhiều tầng.
- Không thêm dữ liệu học thuật mới.
- Không tạo nhãn reviewed/verified giả.
- Không claim production-ready.

## Verify source-level
- Chạy: `node scripts/validate-batch91-teacher-workflow-source.mjs`.
- Chạy: `node scripts/run-source-validators.mjs`.

## Chưa verify
- Chưa build Next production trong môi trường thật.
- Chưa chạy hosted URL smoke bằng domain thật.
- Chưa test điện thoại thật.
- Chưa test xuất DOCX/PDF runtime thật.

## Kết luận
Batch91 là teacher workflow guard/source-level UIUX. Nó giúp test tiếp mà không phải mở rộng dữ liệu ngay, nhưng vẫn phải chạy host/build/mobile/export smoke thật trước khi chia demo rộng.

## Claim limit
Không production-ready. Không claim production-ready nếu chưa có build, hosted smoke, mobile QA và export runtime thật.

không production-ready
