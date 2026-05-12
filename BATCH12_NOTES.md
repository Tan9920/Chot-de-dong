# Batch 12 Notes

## Mục tiêu
Siết lớp kiểm soát độ chính xác học thuật để hệ thống phù hợp hơn cho môi trường thầy cô / nhà trường, thay vì chỉ phân biệt seed-demo và verified trên bề mặt.

## Nâng cấp chính
1. **Academic quality gate**
   - Published academic content phải ở `verified`
   - Reviewed/verified phải có references chặt hơn
   - Nguồn CTGDPT / official guidance / textbook phải có `pages`
   - Verified phải có trace reviewed + verified

2. **Cross-entity academic consistency**
   - Program/question/rubric/resource bị gắn cờ nếu trỏ tới topic không tồn tại trong repository
   - Phát hiện duplicate scope/topic và duplicate content trong cùng scope học thuật
   - Topic published bị gắn blocker nếu thiếu outcomes hoặc subject competencies

3. **Admin reporting**
   - `GET /api/admin/content` trả thêm `academicQuality`
   - `GET /api/admin/content/report` trả thêm `academicQuality`
   - API mới `GET /api/admin/content/quality`
   - Admin UI có dashboard riêng cho blocker học thuật

4. **CLI/reporting**
   - Thêm script `npm run content:quality`

## Verify trong artifact này
- `npm run typecheck` pass sau khi nâng batch 12

## Chưa verify trong artifact này
- Next.js runtime dev/build
- Prisma runtime thật với PostgreSQL
- UI browser flow end-to-end

## Lưu ý trung thực
- Batch này **không chứng minh dữ liệu hiện tại đã đúng tuyệt đối**.
- Batch này làm điều đúng hơn: **không cho dữ liệu học thuật thiếu chứng cứ hoặc còn blocker chất lượng đi qua publish**.
