import fs from 'node:fs';
import path from 'node:path';

const policy = JSON.parse(fs.readFileSync('data/batch150-p0-p1-to-p2-transition-policy.json', 'utf8'));
function write(rel, text) {
  fs.mkdirSync(path.dirname(rel), { recursive: true });
  fs.writeFileSync(rel, text, 'utf8');
}

const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.GIAOAN_DEMO_URL || 'https://<your-vercel-domain>';
const steps = [
  {
    title: '1. Đẩy đúng ZIP Batch150 lên GitHub repo hiện tại',
    commands: [
      'unzip giao-an-mvp-vn-batch150-p0-p1-to-p2-transition-gate.zip',
      'cd giao-an-batch150',
      'git status',
      'git add .',
      'git commit -m "Batch150 P0 P1 to P2 transition gate"',
      'git push origin main'
    ],
    passEvidence: 'GitHub repo có commit Batch150 và workflow .github/workflows/p0-hosted-final-proof.yml.'
  },
  {
    title: '2. Deploy lên Vercel và lấy URL thật',
    commands: [
      'Vercel Dashboard > Add New Project hoặc chọn project cũ > Import GitHub repo',
      'Framework: Next.js; Node target: 24.x theo package.json engines',
      'Deploy xong copy URL dạng https://...vercel.app',
      'Mở URL trên trình duyệt điện thoại/máy tính để chắc chắn trang trả 200, không phải preview lỗi'
    ],
    passEvidence: 'Có URL HTTPS thật, không phải localhost, không phải ảnh chụp màn hình local.'
  },
  {
    title: '3. Chạy GitHub Actions P0 Hosted Final Proof bằng URL thật',
    commands: [
      'GitHub repo > Actions > P0 Hosted Final Proof > Run workflow',
      `app_url = ${appUrl}`,
      'strict = true',
      'Run workflow và chờ xong'
    ],
    passEvidence: 'Workflow dùng Node 24, có GITHUB_RUN_ID, APP_URL HTTPS và upload artifact p0-hosted-final-proof-artifacts.'
  },
  {
    title: '4. Nếu Vercel có Protection/Password thì thêm bypass secret',
    commands: [
      'Vercel Project > Settings > Deployment Protection > Protection Bypass for Automation',
      'Copy secret bypass',
      'GitHub repo > Settings > Secrets and variables > Actions > New repository secret',
      'Name: VERCEL_AUTOMATION_BYPASS_SECRET',
      'Value: <secret bạn copy từ Vercel>',
      'Chạy lại workflow'
    ],
    passEvidence: 'Hosted smoke không còn bị chặn bởi Vercel protection/401/403.'
  },
  {
    title: '5. Tải artifact và kiểm bằng chứng thật',
    commands: [
      'Mở workflow run vừa chạy > Artifacts > tải p0-hosted-final-proof-artifacts',
      'Giải nén artifact vào thư mục repo hoặc kiểm trong artifact package',
      'npm run p0:hosted-proof-closure-dossier:strict',
      'npm run p0:hosted-proof-authenticity-lock:strict',
      'npm run p0-p1:to-p2-transition-gate -- --strict-public'
    ],
    passEvidence: 'closure dossier pass, authenticity lock pass, PNG screenshot inventory đủ, artifact cùng một run.'
  },
  {
    title: '6. Chỉ sau đó mới nói hosted proof closed; vẫn chưa production-ready nếu chưa review production',
    commands: [
      'npm run public-rollout:readiness-report',
      'Rà production DB/session/security/legal/privacy/copyright trước public rộng hoặc thu tiền'
    ],
    passEvidence: 'Có checklist production DB/security/legal riêng, không chỉ source-level JSON.'
  }
];

const guide = {
  ok: true,
  batch: policy.batch,
  version: policy.version,
  generatedAt: new Date().toISOString(),
  appUrlUsedForTemplate: appUrl,
  steps,
  unresolvedCannotBeSolvedInsideChat: policy.externalHardBlockers,
  safeStatusAfterBatch150: {
    p2SourceWorkMayStartWhenLocalGatePasses: true,
    p2PublicExposureAllowed: false,
    productionReady: false,
    publicRolloutAllowed: false
  },
  noAiPaymentVerifiedFakeAdded: true
};
write(policy.artifacts.operatorGuideJson, `${JSON.stringify(guide, null, 2)}\n`);
const md = `# Batch150 External Closure Operator Guide\n\n${steps.map((step) => `## ${step.title}\n\n${step.commands.map((cmd) => `\`${cmd}\``).join('\n\n')}\n\n**Bằng chứng pass:** ${step.passEvidence}`).join('\n\n')}\n\n## Không được claim khi chưa có artifact thật\n\n- Không nói production-ready.\n- Không nói hosted proof closed nếu chưa có GitHub Actions Node24 + Vercel APP_URL + PNG thật.\n- Không nói P0/P1 100% nếu chỉ chạy local Node22.\n- Không mở public rollout/payment/AI/community auto-public.\n`;
write(policy.artifacts.operatorGuideMarkdown, md);
console.log(JSON.stringify(guide, null, 2));
