# Basic Product Foundation — Batch70

Batch70 sửa hướng Batch69: phần cơ bản không được chỉ là demo UI. Web phải dễ dùng ngay, nhưng cũng phải có nền móng để đi tiếp đến sản phẩm thật.

## Chốt hướng

Sản phẩm giai đoạn đầu không lấy AI làm lõi. Định vị đúng:

> Nền tảng soạn giáo án, quản lý học liệu, xuất Word/PDF, cộng đồng giáo viên và workspace tổ chuyên môn/trường học.

Không quảng cáo là AI tạo giáo án chuẩn 100%, không nói dữ liệu seed/scaffold là chuẩn Bộ, không nói dùng ngay không cần giáo viên kiểm tra.

## Nền cơ bản bắt buộc

1. **Luồng người dùng thường**
   - Mở trang chủ hiểu ngay.
   - Chọn lớp/môn/bộ sách/bài.
   - Tạo khung giáo án an toàn.
   - Chỉnh sửa.
   - Lưu.
   - Xuất DOCX/PDF.

2. **Đường dài của storage**
   - Demo có thể dùng localStorage.
   - Bản thật phải có SavedLesson/SavedLessonVersion và migration rõ.
   - Không được coi localStorage là production storage.

3. **Đường dài của export**
   - DOCX/PDF không chỉ tải được.
   - Cần header/footer, watermark theo gói, trạng thái bản nháp/review/approved, nhãn dữ liệu và compliance packet phù hợp.

4. **Mô hình sự thật dữ liệu**
   - seed
   - scaffold
   - community
   - reviewed
   - verified
   - approved_for_release

   Nếu thiếu reviewed/verified, hệ thống chỉ dựng khung an toàn và yêu cầu giáo viên bổ sung/kiểm tra.

5. **Chế độ giao diện**
   - Dễ dùng: tạo giáo án, giáo án của tôi, xuất Word/PDF, hướng dẫn, hỗ trợ.
   - Tiêu chuẩn: template, kho cá nhân, phiếu/slide, lịch, cộng đồng cơ bản.
   - Nâng cao: creator/admin, version compare, workflow, moderation, coverage/governance board.

6. **Plan/usage foundation**
   - Free dùng được thật nhưng có quota export/lưu trữ.
   - Pro dùng sướng hơn: export đẹp, versioning, checklist, phiếu/slide.
   - Team có workflow, kho tổ, comment, duyệt.
   - School có phân quyền, mẫu trường, dashboard, audit trail.

7. **Community foundation**
   - Không public tự do.
   - Phải có draft/submitted/needs_revision/rejected/approved_community/verified_official/taken_down.
   - Phải có report/takedown, anti-spam, chống tự vote, log điểm.

8. **Runtime gates**
   - npm install hoặc npm ci pass thật.
   - imports/data/product validators pass.
   - typecheck pass.
   - build pass.
   - live HTTP smoke pass.
   - browser/mobile QA tối thiểu.

## File/code Batch70

- `data/product-foundation.json`: cấu hình versioned cho core flow, data truth, plan, community, runtime gates.
- `lib/product-foundation.ts`: dựng product foundation board.
- `app/api/product/foundation/route.ts`: API kiểm tra foundation.
- `scripts/validate-product-foundation-source.mjs`: validator chống thiếu sót.
- `components/workspace.tsx`: hiển thị foundation gọn, không làm rối người dùng thường.
- `lib/demo-basic-flow.ts`: basic flow board kiểm luôn product foundation.

## Điều chưa được claim

Batch70 vẫn chưa được gọi production-ready nếu chưa chạy được:

```bash
npm install
npm run smoke:batch70
npm run typecheck
npm run build
npm run start
```

Sau deploy thật cần mở:

```bash
/
/api/health
/api/demo/readiness
/api/demo/basic-flow
/api/product/foundation
```

## Batch tiếp theo nên làm

**Batch71 — Persistence & Real Saved Lesson Foundation**

Lý do: điểm yếu thật sau khi khóa nền móng là lưu nháp vẫn dùng localStorage. Muốn web tiến gần sản phẩm thật thì phải có saved lesson repository, versioning tối thiểu, storage mode rõ, API save/list/update/export by saved id và migration path sang database.

## Batch71 — Saved Lesson Persistence Foundation

Batch71 chuyển phần lưu/mở giáo án từ localStorage/RAM-only sang JSON persistence foundation:

- `data/saved-lessons.json` lưu danh sách giáo án đã lưu qua API.
- `data/saved-lesson-versions.json` lưu phiên bản mỗi lần save/restore.
- `lib/storage.ts` đọc/ghi JSON bằng atomic temp file + rename ở mức demo.
- Workspace ưu tiên POST `/api/lessons`; localStorage chỉ là fallback khi route server lỗi.

Giới hạn phải ghi rõ: đây chưa phải database production. Trước khi dùng rộng cần DB thật, migration, backup, locking đa instance, quyền truy cập/session thật, rate limit/CSRF thật và live smoke.


## Batch72 — Export Quality & Compliance Packet

Batch72 closes the next basic-product gap after persistence: exports should come from saved lesson state when possible, not only from a temporary request payload. DOCX/PDF include lesson status, source status, support level, review/release metadata, watermark, and a compliance packet. This does not make the content verified; it makes the exported file more honest about what is draft/source-level/scaffold.


## Batch73 — Runtime Security Closure

Batch73 giảm các điểm demo/no-op lớn trước public demo: session cookie đọc từ JSON session store, CSRF header+cookie, same-origin guard, in-memory rate-limit, password hash bằng scrypt, permission guard theo owner/school/department/visibility, và security audit JSON. Đây vẫn là source-level/demo foundation; chưa claim production-ready nếu install/typecheck/build/live smoke chưa pass.

Lệnh mới: `npm run runtime:security-validate`, `npm run smoke:batch73`, `npm run verify:batch73`.

## Batch74 subject data truth foundation

The product must not treat scaffold coverage as verified curriculum data. Batch74 adds a subject data truth registry and API so the platform can answer these questions honestly:

- Which grades and subjects are represented in the product scope?
- Which rows are only scaffold/starter?
- Which rows have seed/demo data?
- Which rows are reviewed/verified and allowed to support deeper content?
- Should the generator create a safe lesson frame only?
- Is Casio/máy tính cầm tay guidance allowed?

Current Batch74 answer: the registry covers grades 1–12 broadly, but deep content is not allowed because no row has reviewed/foundation data with approved references. The generator must therefore produce safe frames and require teachers to add lawful, checked lesson content.

## Batch75 — Dữ liệu môn học và soạn giáo án tốt hơn

Batch75 bổ sung hai nền tảng quan trọng:

1. **Curriculum import/review pipeline foundation**
   - Dữ liệu môn/bài muốn nhập phải có lớp, môn, bộ sách/chương trình, chủ đề, nguồn, license, attribution, review status và release tier.
   - Import route hiện chỉ preview để tránh ghi dữ liệu chưa kiểm chứng vào hệ thống.
   - Không tự nâng seed/scaffold thành reviewed/verified.

2. **Lesson drafting quality foundation**
   - Generator dùng hồ sơ sư phạm theo lớp/mục tiêu thay vì một template máy móc.
   - Lớp 1–2, 3–4, lớp 5, 6–9, 10–12, ôn thi vào 10 và ôn thi THPT có profile riêng.
   - Khi dữ liệu chưa đủ reviewed/foundation, giáo án chỉ là khung an toàn và yêu cầu giáo viên nhập nội dung từ nguồn hợp pháp.

Điều vẫn chưa đạt:

- Chưa có reviewer chuyên môn thật.
- Chưa có dữ liệu verified mới.
- Chưa có import ghi thật vào registry.
- Chưa chứng minh typecheck/build/live smoke pass.
