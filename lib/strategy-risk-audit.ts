import fs from 'fs';
import path from 'path';

type RiskSeverity = 'info' | 'warning' | 'blocker';
type RiskArea = 'runtime' | 'source_truth' | 'strategy_alignment' | 'community' | 'data_legal' | 'type_hygiene' | 'deploy';

type StrategyRisk = {
  id: string;
  area: RiskArea;
  severity: RiskSeverity;
  title: string;
  evidence: string;
  recommendation: string;
};

function root(file: string) { return path.join(process.cwd(), file); }
function exists(file: string) { return fs.existsSync(root(file)); }
function read(file: string) { try { return fs.readFileSync(root(file), 'utf8'); } catch { return ''; } }
function readJson<T>(file: string, fallback: T): T { try { return JSON.parse(read(file)) as T; } catch { return fallback; } }
function count(pattern: RegExp, text: string) { return (text.match(pattern) || []).length; }
function risk(id: string, area: RiskArea, severity: RiskSeverity, title: string, evidence: string, recommendation: string): StrategyRisk { return { id, area, severity, title, evidence, recommendation }; }

function detectStub(file: string) {
  const text = read(file);
  const lines = text.split('\n').filter((line) => line.trim()).length;
  const compactReturnCount = count(/export\s+async\s+function\s+\w+\([^)]*\)\s*\{\s*return\s+\{/g, text);
  return { file, lines, compactReturnCount, text };
}

export async function buildStrategyRiskAudit() {
  const risks: StrategyRisk[] = [];
  const pkg = readJson<any>('package.json', {});
  const lock = read('package-lock.json');
  const foundation = readJson<any>('data/product-foundation.json', {});
  const types = read('lib/types.ts');
  const activityModeration = detectStub('lib/activity-game-moderation.ts');
  const forumSafety = detectStub('lib/forum-thread-safety.ts');
  const communityModeration = detectStub('lib/community-moderation.ts');
  const releaseWorkflow = detectStub('lib/release-signoff-workflow.ts');
  const sourceRunner = read('scripts/run-source-validators.mjs');
  const cleanCi = read('scripts/clean-npm-ci.mjs');
  const strategyRouteExists = exists('app/api/product/strategy-risk-audit/route.ts');

  if (!exists('node_modules/.bin/next')) {
    risks.push(risk('missing_next_dependency', 'runtime', 'blocker', 'Chưa có Next dependency đã cài', 'node_modules/.bin/next không tồn tại trong repo artifact.', 'Chạy npm run install:clean ở máy/CI có internet rồi mới claim build/live smoke.'));
  }
  if ((process.env.NPM_CONFIG_REGISTRY || '').includes('@')) {
    risks.push(risk('credentialed_registry_env', 'deploy', 'blocker', 'Môi trường đang inject registry có credential/protected', 'NPM_CONFIG_REGISTRY chứa credential hoặc registry protected.', 'Dùng clean scripts hoặc gỡ biến env registry ở CI/host.'));
  }
  if (/packages\.applied-caas-gateway1\.internal\.api\.openai\.org/.test(lock)) {
    risks.push(risk('internal_registry_in_lockfile', 'deploy', 'blocker', 'Lockfile còn URL registry nội bộ', 'package-lock.json chứa registry nội bộ sandbox.', 'Chạy npm run lockfile:public-registry trước khi phát hành artifact.'));
  }
  if (!sourceRunner.includes('timeout') || !sourceRunner.includes('GIAOAN_SOURCE_VALIDATOR_TIMEOUT_MS')) {
    risks.push(risk('validator_runner_can_hang', 'runtime', 'blocker', 'Source validator runner có thể treo vô hạn', 'scripts/run-source-validators.mjs thiếu per-validator timeout.', 'Thêm timeout/fail-closed để không báo kiểm thử giả.'));
  }
  if (!cleanCi.includes('GIAOAN_NPM_CI_TIMEOUT_MS') || !cleanCi.includes('fetch-timeout')) {
    risks.push(risk('npm_install_can_hang', 'deploy', 'warning', 'Clean npm install có thể treo do DNS/registry', 'scripts/clean-npm-ci.mjs thiếu timeout/fetch-timeout rõ.', 'Thêm timeout và thông báo timeout là fail, không phải pass.'));
  }
  if (count(/= any;/g, types) > 25) {
    risks.push(risk('types_any_surface', 'type_hygiene', 'warning', 'Type-surface còn nhiều any', `lib/types.ts còn ${count(/= any;/g, types)} alias any.`, 'Các batch sau nên thay dần any bằng type thật cho SavedLesson, CommunityResource, ActivityGame, GovernanceSnapshot.'));
  }
  if (releaseWorkflow.lines <= 10 || releaseWorkflow.compactReturnCount >= 2) {
    risks.push(risk('release_signoff_in_memory_foundation', 'source_truth', 'warning', 'Release signoff còn foundation/in-memory', `${releaseWorkflow.file} chỉ ${releaseWorkflow.lines} dòng và chưa bền vững qua restart.`, 'Không dùng signoff foundation để claim school/public release thật; cần JSON/DB/audit log ở batch riêng.'));
  }
  for (const stub of [activityModeration, forumSafety, communityModeration]) {
    if (stub.lines <= 5 || stub.compactReturnCount >= 1) {
      risks.push(risk(`stub_${stub.file.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`, 'community', 'blocker', 'Module cộng đồng có dấu hiệu stub', `${stub.file} chỉ ${stub.lines} dòng hoặc return demo trực tiếp.`, 'Module cần persistence JSON fallback, readiness gate, moderation status, source/license/takedown logic.'));
    }
  }
  if (!foundation?.positioning?.nonAiFirst) {
    risks.push(risk('non_ai_positioning_missing', 'strategy_alignment', 'blocker', 'Thiếu định vị non-AI trong product foundation', 'data/product-foundation.json không bật positioning.nonAiFirst.', 'Giữ định vị nền tảng soạn giáo án/kho học liệu/xuất file, không bán AI giai đoạn đầu.'));
  }
  if (!foundation?.communityFoundation?.publicRule) {
    risks.push(risk('community_public_rule_missing', 'community', 'blocker', 'Thiếu rule không public tự do', 'data/product-foundation.json thiếu communityFoundation.publicRule.', 'Bắt buộc mọi community/resource/game/thread đi qua moderation/review/report/takedown.'));
  }
  if (!strategyRouteExists) {
    risks.push(risk('strategy_audit_api_missing', 'strategy_alignment', 'warning', 'Thiếu API audit chiến lược/rủi ro', 'Không có app/api/product/strategy-risk-audit/route.ts.', 'Thêm endpoint source-level để demo/QA thấy các rủi ro ẩn thay vì chỉ nhìn UI.'));
  }

  const blockers = risks.filter((item) => item.severity === 'blocker').length;
  const warnings = risks.filter((item) => item.severity === 'warning').length;
  return {
    generatedAt: new Date().toISOString(),
    status: blockers ? 'blocked' : warnings ? 'usable_with_warnings' : 'source_aligned_with_known_limits',
    summary: { total: risks.length, blockers, warnings, info: risks.filter((item) => item.severity === 'info').length },
    risks,
    alignedPrinciples: [
      'Không lấy AI làm lõi giai đoạn đầu.',
      'Seed/scaffold/community không được nâng thành verified bằng lời quảng cáo.',
      'Thiếu dữ liệu thì dựng khung giáo án an toàn.',
      'Cộng đồng/game/activity phải có moderation, report và takedown.',
      'Không claim deploy-ready nếu install/build/live smoke chưa pass.'
    ],
    nextBatchSuggestion: blockers ? 'Đóng blocker runtime/deploy/community trước khi thêm tính năng mới.' : 'Có thể chuyển sang workflow release/signoff persistence hoặc UI strategy board.'
  };
}
