# BATCH93 RUNTIME METADATA SMOKE

Batch93 bổ sung guard để trạng thái repo và smoke runtime phản ánh đúng Batch92 starter data expansion.

## Điều smoke metadata phải kiểm

Khi `/api/metadata` chạy được trên runtime thật, smoke phải xác nhận:

- `starterCatalog` tồn tại.
- `starterCatalog.gradeCount === 12`.
- `starterCatalog.subjectScopeCount >= 100`.
- `starterCatalog.topicCount >= 300`.
- `starterCatalog.contentDepthAllowed === false`.
- `subjectDataTruth.deepContentAllowedRecords === 0`.
- Curriculum catalog có starter topics cho lớp 1.

## Lệnh

```bash
npm run runtime-metadata:validate
npm run smoke:batch93
GIAOAN_DEMO_URL=https://your-vercel-domain.vercel.app npm run hosted:url-smoke
```
