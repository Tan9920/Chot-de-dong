import fs from 'fs';
import path from 'path';

type CheckStatus = 'pass' | 'warning' | 'blocker';

type BasicFlowCheck = {
  id: string;
  label: string;
  kind: 'page' | 'api' | 'config' | 'export' | 'storage' | 'ux';
  status: CheckStatus;
  note: string;
};

function exists(root: string, file: string) {
  return fs.existsSync(path.join(root, file));
}

function read(root: string, file: string) {
  try {
    return fs.readFileSync(path.join(root, file), 'utf8');
  } catch {
    return '';
  }
}

function checkFile(root: string, id: string, label: string, kind: BasicFlowCheck['kind'], note: string): BasicFlowCheck {
  const ok = exists(root, id);
  return { id, label, kind, status: ok ? 'pass' : 'blocker', note: ok ? note : `Thiếu ${id}` };
}

export async function buildBasicWebFlowBoard() {
  const root = process.cwd();
  const workspace = read(root, 'components/workspace.tsx');
  const exporter = read(root, 'lib/exporter.ts');
  const pkg = read(root, 'package.json');
  const storage = read(root, 'lib/storage.ts');

  const checks: BasicFlowCheck[] = [
    checkFile(root, 'app/page.tsx', 'Trang chủ mở được', 'page', 'Trang chủ trỏ vào workspace demo.'),
    checkFile(root, 'components/workspace.tsx', 'Workspace người dùng thường', 'ux', 'Có form lớp/môn/bài, vùng chỉnh sửa, lưu nháp, xuất file.'),
    checkFile(root, 'app/api/health/route.ts', 'Health API', 'api', 'Có endpoint kiểm tra runtime.'),
    checkFile(root, 'app/api/demo/readiness/route.ts', 'Readiness API', 'api', 'Có endpoint kiểm tra readiness source-level.'),
    checkFile(root, 'app/api/demo/basic-flow/route.ts', 'Basic flow API', 'api', 'Có endpoint kiểm tra luồng web cơ bản.'),
    checkFile(root, 'app/api/product/foundation/route.ts', 'Product foundation API', 'api', 'Có endpoint kiểm tra nền móng sản phẩm dài hạn, không chỉ demo UI.'),
    checkFile(root, 'data/product-foundation.json', 'Product foundation config', 'config', 'Có cấu hình versioned cho core flow, data truth, plan, community, runtime gates.'),
    checkFile(root, 'data/saved-lessons.json', 'Saved lessons JSON store', 'storage', 'Có file lưu giáo án demo bền hơn RAM/localStorage.'),
    checkFile(root, 'data/saved-lesson-versions.json', 'Saved lesson versions JSON store', 'storage', 'Có file lưu phiên bản giáo án demo để mở/so sánh/phục hồi.'),
    checkFile(root, 'app/api/template-builder/route.ts', 'Tạo khung giáo án', 'api', 'Có route tạo khung giáo án không-AI.'),
    checkFile(root, 'app/api/export/docx/route.ts', 'Xuất DOCX', 'export', 'Có route xuất DOCX qua POST.'),
    checkFile(root, 'app/api/export/pdf/route.ts', 'Xuất PDF', 'export', 'Có route xuất PDF qua POST.'),
    checkFile(root, 'lib/export-saved-lesson.ts', 'Resolve export theo saved lesson', 'export', 'Có helper đọc SavedLesson theo lessonId/savedLessonId trước khi xuất file.'),
    checkFile(root, '.env.example', 'Env demo mẫu', 'config', 'Có cấu hình mẫu để deploy demo.'),
    checkFile(root, 'package.json', 'Scripts build/verify', 'config', 'Có scripts install/build/verify.'),
    {
      id: 'workspace-simple-flow',
      label: 'Luồng tạo → sửa → lưu → xuất',
      kind: 'ux',
      status: workspace.includes('Tạo khung giáo án') && workspace.includes('Lưu bản nháp') && workspace.includes('Xuất DOCX') && workspace.includes('Xuất PDF') ? 'pass' : 'blocker',
      note: 'Workspace phải hiện luồng chính ngay trên trang, không bắt giáo viên hiểu dashboard kỹ thuật.'
    },
    {
      id: 'json-persistence-fallback',
      label: 'Lưu nháp có JSON persistence và fallback localStorage',
      kind: 'storage',
      status: workspace.includes('JSON persistence') && workspace.includes('localStorage') && storage.includes('json_file_persistence_fallback') ? 'pass' : 'warning',
      note: 'Demo dùng JSON file để lưu qua server route; localStorage chỉ là fallback, bản thật vẫn cần database/backup/locking.'
    },
    {
      id: 'honest-data-labeling',
      label: 'Nhãn dữ liệu trung thực',
      kind: 'ux',
      status: workspace.includes('Seed/scaffold') && workspace.includes('chưa phải kho nội dung verified') ? 'pass' : 'warning',
      note: 'UI phải nói rõ seed/scaffold/demo, tránh hiểu nhầm là dữ liệu đã duyệt.'
    },
    {
      id: 'docx-real-zip',
      label: 'DOCX là file OpenXML tối thiểu',
      kind: 'export',
      status: exporter.includes('word/document.xml') && exporter.includes('PK') ? 'pass' : 'warning',
      note: 'Xuất DOCX nên là file .docx mở được, không chỉ là text đổi đuôi.'
    },
    {
      id: 'long-term-foundation-not-demo-only',
      label: 'Không chỉ dừng ở demo',
      kind: 'config',
      status: workspace.includes('/api/product/foundation') && pkg.includes('product:foundation-validate') ? 'pass' : 'warning',
      note: 'Luồng cơ bản phải nối với product foundation: plan, storage path, data truth, moderation, runtime gates.'
    },

    {
      id: 'saved-lesson-export-foundation',
      label: 'Export theo giáo án đã lưu có compliance packet',
      kind: 'export',
      status: exporter.includes('complianceLines') && read(root, 'lib/export-saved-lesson.ts').includes('resolveLessonExportPayload') ? 'pass' : 'warning',
      note: 'Batch72 yêu cầu route export đọc lại SavedLesson khi có lessonId/savedLessonId và gắn nhãn dữ liệu/governance/compliance packet vào DOCX/PDF.'
    },
    {
      id: 'verify-deploy-script',
      label: 'Một lệnh verify deploy',
      kind: 'config',
      status: pkg.includes('verify:deploy') ? 'pass' : 'warning',
      note: 'Có script gom các bước kiểm tra deploy.'
    }
  ];

  const blockers = checks.filter((check) => check.status === 'blocker');
  const warnings = checks.filter((check) => check.status === 'warning');

  return {
    generatedAt: new Date().toISOString(),
    status: blockers.length ? 'blocked' : warnings.length ? 'demo_usable_with_warnings' : 'basic_demo_ready_source_level',
    summary: {
      total: checks.length,
      pass: checks.filter((check) => check.status === 'pass').length,
      warning: warnings.length,
      blocker: blockers.length
    },
    checks,
    blockers,
    warnings,
    userFlow: [
      'Mở trang chủ',
      'Chọn lớp/môn/bộ sách/bài',
      'Tạo khung giáo án an toàn',
      'Chỉnh sửa nội dung',
      'Lưu bản nháp qua JSON persistence hoặc fallback trình duyệt',
      'Xuất DOCX/PDF từ payload tạm hoặc từ savedLessonId đã lưu',
      'Đối chiếu /api/product/foundation để biết phần nào là demo, phần nào cần nâng cấp lâu dài'
    ],
    nonGoals: ['Không thêm AI', 'Không thêm thanh toán thật', 'Không public cộng đồng tự động', 'Không claim dữ liệu seed/scaffold là verified'],
    note: 'Board này kiểm tra source-level cho luồng web cơ bản và liên kết product foundation. Vẫn phải chạy npm install, typecheck, build và smoke trên host thật.'
  };
}
