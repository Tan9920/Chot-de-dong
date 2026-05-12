# Batch107 — Teacher Pilot Completion Slice

Batch107 chuyển hướng khỏi việc chỉ thêm board runtime. Mục tiêu là hoàn thành một phần có thể dùng/nhìn thấy ngay: một demo giáo viên offline không phụ thuộc npm registry hoặc Next build.

## Kết quả chính

- `public/teacher-pilot-demo.html` là artifact độc lập. Sau khi giải nén ZIP, có thể mở file này trong trình duyệt để tạo khung giáo án an toàn.
- Demo có lớp 1-12, môn, chủ đề, thời lượng, nhãn dữ liệu, chế độ Dễ dùng/Tiêu chuẩn/Nâng cao, copy và tải TXT.
- Demo không dùng AI và không sinh kiến thức sâu; các phần chuyên môn yêu cầu giáo viên nhập/chọn từ nguồn hợp lệ.
- API `/api/teacher-pilot/completion` cho phép dựng board và khung giáo án an toàn khi app chạy được.

## Vì sao batch này hợp lý

Batch105/106 đã chỉ ra runtime/hosted vẫn bị chặn bởi registry/install/Next/SWC/build/smoke. Nếu tiếp tục thêm feature phụ thuộc build thì dự án vẫn chững. Batch107 tạo một artifact hoàn chỉnh độc lập để có thể trình bày giá trị sản phẩm không-AI cho nội bộ hoặc test rất nhỏ.

## Không được claim

- Không claim production-ready.
- Không claim hosted/runtime pass.
- Không claim verified 1-12.
- Không claim chuẩn Bộ/đúng 100%/dùng ngay không cần sửa.

## Lệnh kiểm tra

```bash
npm run batch107:teacher-pilot-completion-validate
npm run teacher-pilot:completion-report
npm run smoke:batch107
```

`verify:batch107` vẫn bao gồm runtime/build/smoke thật và dự kiến chưa pass nếu môi trường vẫn thiếu npm registry/Next binary.
