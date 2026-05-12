import fs from 'fs';
import path from 'path';

type FoundationStatus = 'pass' | 'warning' | 'blocker';

type ProductFoundationCheck = {
  id: string;
  label: string;
  area: 'positioning' | 'core_flow' | 'data_truth' | 'ux' | 'plan' | 'community' | 'runtime' | 'export' | 'storage';
  status: FoundationStatus;
  note: string;
};

function rootPath(file: string) {
  return path.join(process.cwd(), file);
}

function exists(file: string) {
  return fs.existsSync(rootPath(file));
}

function read(file: string) {
  try {
    return fs.readFileSync(rootPath(file), 'utf8');
  } catch {
    return '';
  }
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(read(file)) as T;
  } catch {
    return fallback;
  }
}

function checkFile(id: string, label: string, area: ProductFoundationCheck['area'], note: string): ProductFoundationCheck {
  return {
    id,
    label,
    area,
    status: exists(id) ? 'pass' : 'blocker',
    note: exists(id) ? note : `Thiếu ${id}`
  };
}

function includesAll(content: string, terms: string[]) {
  return terms.every((term) => content.includes(term));
}

export async function buildProductFoundationBoard() {
  const foundation = readJson<any>('data/product-foundation.json', {});
  const workspace = read('components/workspace.tsx');
  const pkg = read('package.json');
  const exporter = read('lib/exporter.ts');
  const generator = read('lib/generator.ts');
  const demoBasicFlow = read('lib/demo-basic-flow.ts');
  const storage = read('lib/storage.ts');

  const checks: ProductFoundationCheck[] = [
    checkFile('data/product-foundation.json', 'Có cấu hình nền móng sản phẩm dài hạn', 'positioning', 'Product foundation được version hóa bằng JSON, không chỉ nằm trong chat/prompt.'),
    checkFile('app/api/product/foundation/route.ts', 'Có API product foundation', 'runtime', 'Có endpoint để UI/deploy smoke đọc được nền móng dài hạn.'),
    checkFile('docs/BASIC_PRODUCT_FOUNDATION.md', 'Có tài liệu nền móng cơ bản dài hạn', 'positioning', 'Có tài liệu phân biệt demo, foundation và production.'),
    {
      id: 'safe-positioning-copy',
      label: 'Định vị không-AI đúng hướng',
      area: 'positioning',
      status: foundation?.positioning?.nonAiFirst === true && !workspace.includes('AI tạo giáo án chuẩn 100%') ? 'pass' : 'blocker',
      note: 'Trang chính và foundation phải nói là nền tảng soạn giáo án/kho học liệu/xuất file, không bán AI.'
    },
    {
      id: 'core-flow-not-demo-only',
      label: 'Luồng cơ bản được mô hình hóa dài hạn',
      area: 'core_flow',
      status: Array.isArray(foundation?.coreFlow) && foundation.coreFlow.length >= 5 ? 'pass' : 'blocker',
      note: 'Core flow phải bao gồm trang chủ, template builder, save/reopen, export và checklist.'
    },
    {
      id: 'data-truth-model-present',
      label: 'Mô hình sự thật dữ liệu đầy đủ',
      area: 'data_truth',
      status: includesAll(JSON.stringify(foundation?.dataTruthModel || {}), ['seed', 'scaffold', 'community', 'reviewed', 'verified', 'approved_for_release']) ? 'pass' : 'blocker',
      note: 'Nhãn dữ liệu phải xuyên suốt workspace/export/community/admin, không verified giả.'
    },
    {
      id: 'safe-frame-rule',
      label: 'Thiếu dữ liệu thì chỉ dựng khung an toàn',
      area: 'data_truth',
      status: includesAll(JSON.stringify(foundation), ['khung giáo án an toàn', 'không sinh kiến thức sâu']) && generator.includes('khung demo an toàn') ? 'pass' : 'warning',
      note: 'Nếu lớp/môn/bài chưa verified, hệ thống không được bịa kiến thức sâu/câu hỏi/đáp án chắc chắn.'
    },
    {
      id: 'interface-modes',
      label: 'Có Dễ dùng/Tiêu chuẩn/Nâng cao',
      area: 'ux',
      status: includesAll(JSON.stringify(foundation?.interfaceModes || []), ['Dễ dùng', 'Tiêu chuẩn', 'Nâng cao']) ? 'pass' : 'warning',
      note: 'Workspace người dùng thường phải đơn giản; governance/admin ở chế độ nâng cao.'
    },
    {
      id: 'plan-foundation',
      label: 'Có nền gói Free/Pro/Team/School',
      area: 'plan',
      status: foundation?.planFoundation?.free && foundation?.planFoundation?.pro && foundation?.planFoundation?.team && foundation?.planFoundation?.school ? 'pass' : 'blocker',
      note: 'Cơ bản dài hạn phải tính quota/lưu trữ/export/workflow, không chỉ demo local.'
    },
    {
      id: 'community-moderation-foundation',
      label: 'Cộng đồng có trạng thái moderation/takedown',
      area: 'community',
      status: includesAll(JSON.stringify(foundation?.communityFoundation || {}), ['submitted', 'approved_community', 'taken_down', 'Không public tự do']) ? 'pass' : 'blocker',
      note: 'Forum/kho học liệu/game/activity không được public tự động khi chưa có kiểm duyệt.'
    },
    {
      id: 'export-foundation',
      label: 'Export có đường nâng cấp lâu dài',
      area: 'export',
      status: exporter.includes('word/document.xml') && includesAll(JSON.stringify(foundation), ['watermark', 'nhãn dữ liệu']) ? 'pass' : 'warning',
      note: 'DOCX/PDF không chỉ tải được; về lâu dài phải có watermark, trạng thái dữ liệu và trạng thái duyệt.'
    },
    {
      id: 'storage-not-production-claim',
      label: 'Không coi JSON/local fallback là production storage',
      area: 'storage',
      status: includesAll(JSON.stringify(foundation?.persistenceFoundation || foundation?.nextBatchRecommendation || {}), ['SavedLesson', 'JSON persistence', 'not a database']) || workspace.includes('JSON persistence foundation') ? 'pass' : 'warning',
      note: 'Lưu nháp demo phải có migration path sang database thật, backup và locking trước khi public rộng.'
    },
    {
      id: 'saved-lesson-json-persistence',
      label: 'Có SavedLesson/SavedLessonVersion JSON persistence',
      area: 'storage',
      status: exists('data/saved-lessons.json') && exists('data/saved-lesson-versions.json') && storage.includes('safeWriteJson') && storage.includes('getLessonVersions') ? 'pass' : 'warning',
      note: 'Batch71 thay RAM/localStorage-only bằng JSON persistence foundation, nhưng vẫn chưa phải database production.'
    },
    {
      id: 'runtime-gates',
      label: 'Runtime gates không bị bỏ sót',
      area: 'runtime',
      status: Array.isArray(foundation?.runtimeGates) && foundation.runtimeGates.length >= 7 ? 'pass' : 'blocker',
      note: 'Không được claim ổn nếu thiếu npm install/typecheck/build/live smoke/browser QA.'
    },
    {
      id: 'package-scripts-batch70',
      label: 'Có scripts verify Batch70',
      area: 'runtime',
      status: pkg.includes('product:foundation-validate') && pkg.includes('smoke:batch70') && pkg.includes('verify:batch70') ? 'pass' : 'warning',
      note: 'Cần lệnh source-level để chống thiếu sót ở mỗi batch.'
    },
    {
      id: 'basic-flow-knows-product-foundation',
      label: 'Basic flow không còn chỉ là demo check',
      area: 'core_flow',
      status: demoBasicFlow.includes('app/api/product/foundation/route.ts') && demoBasicFlow.includes('data/product-foundation.json') ? 'pass' : 'warning',
      note: 'Basic flow board phải kiểm cả product foundation để tránh vá UI ngắn hạn.'
    }
  ];

  const blockers = checks.filter((check) => check.status === 'blocker');
  const warnings = checks.filter((check) => check.status === 'warning');

  return {
    generatedAt: new Date().toISOString(),
    status: blockers.length ? 'blocked' : warnings.length ? 'foundation_ready_with_warnings' : 'basic_product_foundation_ready_source_level',
    summary: {
      total: checks.length,
      pass: checks.filter((check) => check.status === 'pass').length,
      warning: warnings.length,
      blocker: blockers.length
    },
    checks,
    blockers,
    warnings,
    foundation,
    nextCriticalBatch: foundation?.nextBatchRecommendation || null,
    note: 'Đây là source-level product foundation board. Nó không thay thế npm install/typecheck/build/live HTTP smoke và QA trên thiết bị thật.'
  };
}
