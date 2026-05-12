# Batch 13 - academic release governance

## Trọng tâm
- Siết publish gate cho dữ liệu học thuật bằng review consensus thay vì chỉ 1 approved review.
- Thêm academic release board theo pack để thấy pack nào còn blocker trước khi dùng thật trong nhà trường.

## Những gì đã nâng
- `lib/content-reviews.ts`: thêm review consensus theo lần submit gần nhất, phát hiện unresolved changes/conflict, hỗ trợ gate publish học thuật.
- `lib/content-management.ts`: publish học thuật với leader không còn đi qua chỉ bằng 1 approved review; thêm `getPackReleaseBoard()`.
- API mới: `GET /api/admin/content/release-board`.
- Admin summary/report trả thêm `releaseBoard`.
- Admin UI hiển thị academic release board.
- CLI mới: `npm run content:release-board`.

## Điều vẫn phải nói rõ
- Batch này không tự tạo verified corpus thật.
- Nó làm đúng phần governance để pack nào chưa đủ verified/review consensus thì không thể được coi là sẵn sàng phát hành nội bộ.
