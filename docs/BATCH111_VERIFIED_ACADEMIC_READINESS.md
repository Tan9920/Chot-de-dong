# Batch111 Verified Academic 1–12 Readiness

## Tuyên bố phạm vi

Đợt này chỉ tập trung Verified học thuật thật 1–12. Batch111 không làm UI/UX, không thêm AI, không thêm payment, không mở marketplace/cộng đồng, không đụng referral/quỹ tiền mặt.

Batch111 giải quyết một vấn đề nền: trước đây Academic verified coverage thật vẫn 0–5%, còn `contentDepthAllowedRecords = 0` là đúng vì chưa có nguồn + reviewer + release gate. Batch111 tạo lớp **official source spine** và **verification readiness board** để chuẩn bị nâng verified thật, nhưng không nâng nhãn giả.

## Nâng cấp chính

### 1. Official Curriculum Source Spine

File: `data/official-curriculum-source-catalog.json`

Nội dung chỉ là metadata nguồn chính thống:

- `moet-tt32-2018-ctgdpt`
- `gov-tt20-2021-ctgdpt-amendment`
- `gov-tt13-2022-ctgdpt-amendment`
- `gov-tt17-2025-ctgdpt-amendment`

Policy bắt buộc:

- chỉ dùng metadata/mapping/trích yếu ngắn hợp pháp;
- không copy dài SGK/sách giáo viên/phụ lục bản quyền;
- không tự nâng mọi lớp/môn/bài thành verified chỉ vì có văn bản chương trình;
- official source spine không bằng verified bài học.

### 2. Academic Verification Readiness Dossier

File: `data/academic-verification-readiness-dossier.json`

Dossier định nghĩa:

- pilot lanes cho Tiểu học lõi, lớp chuyển tiếp, môn chịu ảnh hưởng sửa đổi chương trình;
- release candidates thí điểm như g5-toan, g5-tieng-viet, g6-lich-su-va-dia-li;
- lý do chọn từng candidate;
- danh sách thiếu để được nâng verified;
- policy tách `officialSourceSpineReadyPercent`, `sourcePackReadyPercent`, `reviewedCandidatePercent`, `verifiedOrApprovedPercent`, `deepContentAllowedPercent`.

### 3. Verification Accelerator Library

File: `lib/academic-verification-accelerator.ts`

Hàm chính:

- `buildOfficialCurriculumSourceCatalog()`
- `buildAcademicVerificationReadinessReport()`
- `buildAcademicVerificationReadinessBoard()`

Báo cáo tách rõ:

- có bao nhiêu scope có official source spine;
- có bao nhiêu scope có source pack/reviewer thật;
- có bao nhiêu scope thật sự verified/approved;
- có bao nhiêu scope được bật deep content;
- Batch111 có mutation registry hay không.

### 4. API Board

Routes mới:

- `GET /api/academic/verification-readiness`
- `GET /api/admin/academic-verification-readiness-board`

Cảnh báo route: API không nâng registry thành verified và không bật `contentDepthAllowed`.

### 5. Scripts kiểm tra

Scripts mới:

- `npm run batch111:academic-verification-validate`
- `npm run academic:verification-readiness-report`
- `npm run smoke:batch111`
- `npm run verify:batch111`

Report ghi ra:

- `artifacts/academic-verification-readiness-last-run.json`

## Sự thật quan trọng

Batch111 giúp nâng **khả năng bắt đầu verified thật**, không làm tăng verified content thật nếu chưa có reviewer/source pack. Đây là đúng hướng vì nếu sửa `sourceStatus=verified` bằng code mà chưa có người duyệt thì sẽ là fake verified.

## Gate tối thiểu trước khi nâng một scope

Một scope phải ở safe-frame-only cho tới khi có đủ:

1. source pack bài/chủ đề cụ thể;
2. nguồn hợp pháp hoặc giáo viên/trường sở hữu quyền;
3. không copy dài tài liệu bản quyền;
4. license/attribution/takedown;
5. reviewer thật;
6. approved reference;
7. assessment/rubric review nếu có;
8. export compliance label;
9. release gate mở.

## Chỉ số phải đọc đúng

- `officialSourceSpineReadyPercent`: có xương sống nguồn chương trình để đối chiếu.
- `reviewedCandidatePercent`: có source pack đã được reviewer duyệt ở mức candidate.
- `verifiedOrApprovedPercent`: registry thật đang verified/approved.
- `deepContentAllowedPercent`: scope được phép sinh nội dung sâu.

Không gộp `officialSourceSpineReadyPercent` với `verifiedOrApprovedPercent`.

## Không claim production-ready

Batch111 không chứng minh:

- npm install clean;
- Next build;
- live runtime;
- auth runtime;
- hosted smoke;
- browser QA;
- DOCX/PDF server-side runtime.

Các phần đó để batch khác, không trộn vào đợt Verified học thuật này.


## Batch111 guardrail exact

Không tạo verified giả và không bật contentDepthAllowed khi chưa có reviewer/source pack/release gate thật.
