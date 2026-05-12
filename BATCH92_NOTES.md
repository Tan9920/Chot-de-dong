# Batch92 — starter data expansion for 1–12

Batch92 sửa lại hướng sau Batch91: dữ liệu không phải “đứng im”; repo được mở rộng thêm dữ liệu starter để giáo viên có thể chọn lớp/môn/chủ đề khi test.

## Làm gì

- Thêm `data/starter-curriculum-catalog.json` với 12 khối lớp, 134 phạm vi lớp/môn và 402 starter topics.
- Cập nhật `data/subject-data-registry.json` từ scaffold/starter rỗng sang `seed` + `developing` + `starter_topic_frame_only`.
- Thêm `lib/starter-curriculum-catalog.ts` để đọc topic catalog.
- Cập nhật `lib/subject-data-truth.ts` để metadata/coverage/catalog lấy starter topics thật thay vì chỉ hiện “Bài mở đầu”.
- Cập nhật `lib/content-repository.ts` để `/api/metadata` và search/list topic trả về starter topics.
- Mở rộng `data/activity-game-library.json` lên 13 hoạt động seed/developing, có nhãn source/license/review cảnh báo.
- Cập nhật UI workspace: “Starter data 1–12 — chọn được nhiều hơn nhưng chưa verified”.

## Không làm gì

- Không nâng reviewed/verified.
- Không bật `contentDepthAllowed`.
- Không thêm AI, model, SDK hoặc API key.
- Không thêm câu hỏi/đáp án chuyên sâu hoặc Casio/máy tính cầm tay.
- Không copy dài SGK/sách giáo viên/tài liệu bản quyền.
- Không public học liệu/game/activity như official nếu thiếu review/source/license.

## Ý nghĩa

Batch92 giúp demo đỡ trống: giáo viên có thể chọn nhanh nhiều lớp/môn/chủ đề, đặc biệt để test UI và export. Nhưng tất cả vẫn chỉ là dữ liệu seed/developing. Generator vẫn phải dựng khung an toàn và yêu cầu giáo viên nhập nội dung chuyên môn từ nguồn hợp pháp.

## Verify source-level

- `npm run starter-data:validate`
- `npm run source:validate`
- `npm run data:validate`

Các lệnh build/runtime/hosted smoke vẫn cần chạy trên môi trường thật.

## Marker kiểm soát bắt buộc

- không nâng reviewed/verified bằng dữ liệu starter.
- không thêm AI trong batch dữ liệu này.
