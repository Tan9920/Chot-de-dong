import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root=process.cwd(),artifactPath='artifacts/runtime-p0-local-closure-last-run.json';
const readJson=rel=>{try{return JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));}catch{return null;}};
const exists=rel=>fs.existsSync(path.join(root,rel));
const statTime=rel=>{try{return fs.statSync(path.join(root,rel)).mtime.toISOString();}catch{return null;}};
const timeMs=iso=>{const t=iso?Date.parse(iso):NaN;return Number.isFinite(t)?t:0;};
const pkg=readJson('package.json')||{},policy=readJson('data/runtime-p0-local-closure-policy.json')||{};
const nodeVersionFile=(()=>{try{return fs.readFileSync(path.join(root,'.node-version'),'utf8').trim();}catch{return '';}})();
const guarded=readJson('artifacts/next-build-runtime-guard-last-run.json'),live=readJson('artifacts/live-http-smoke-last-run.json'),auth=readJson('artifacts/auth-invite-runtime-smoke-last-run.json'),verifyRelease=readJson('artifacts/verify-release-last-run.json'),hosted=readJson('artifacts/hosted-demo-url-smoke-last-run.json');
const buildTime=timeMs(guarded?.generatedAt),liveTime=timeMs(live?.generatedAt),authTime=timeMs(auth?.generatedAt);
const hostedPassed=Boolean(hosted?.ok&&(hosted?.status==='hosted_url_smoke_passed'||hosted?.hostedUrlSmokePassed===true));
const hostedFreshEnough=hostedPassed&&timeMs(hosted?.generatedAt)>=buildTime;
const actualNodeMajor=Number(process.versions.node.split('.')[0]),targetMajor=24,requireActualNode24=process.env.GIAOAN_REQUIRE_NODE24==='1';
const requiredArtifacts=['.next/BUILD_ID','.next/app-build-manifest.json','.next/routes-manifest.json','.next/prerender-manifest.json','.next/images-manifest.json','.next/required-server-files.json','.next/server/app-paths-manifest.json','.next/server/pages-manifest.json','.next/server/app','.next/static'];
const missingArtifacts=requiredArtifacts.filter(rel=>!exists(rel));
const liveChecks=Array.isArray(live?.checks)?live.checks:[],authChecks=Array.isArray(auth?.checks)?auth.checks:[];
const liveRoutes=new Set(liveChecks.map(c=>c.route)),requiredLiveRoutes=['/api/health','/api/auth/csrf','/api/template-builder','/api/export/docx','/api/export/pdf'];
const missingLiveRoutes=requiredLiveRoutes.filter(route=>!liveRoutes.has(route));
const liveFailedChecks=liveChecks.filter(c=>!c.ok).length,authFailedChecks=authChecks.filter(c=>!c.ok).length;
const checks=[
{id:'repo_version_126',ok:pkg.version==='0.126.0',evidence:pkg.version||null},
{id:'node_target_24x',ok:pkg.engines?.node==='24.x',evidence:pkg.engines||null},
{id:'node_version_file_24',ok:/^24\./.test(nodeVersionFile),evidence:nodeVersionFile||null},
{id:'actual_node_runtime_is_24_when_required',ok:requireActualNode24?actualNodeMajor===targetMajor:true,evidence:{actual:process.versions.node,requireActualNode24}},
{id:'node_modules_present',ok:exists('node_modules/.bin/next')&&exists('node_modules/@next/swc-linux-x64-gnu'),evidence:{next:exists('node_modules/.bin/next'),swc:exists('node_modules/@next/swc-linux-x64-gnu')}},
{id:'strict_raw_next_build_exit_zero',ok:Boolean(guarded?.ok&&guarded?.status==='raw_next_build_passed'&&guarded?.rawNextBuildExitCode===0),evidence:guarded?{status:guarded.status,exitCode:guarded.rawNextBuildExitCode,generatedAt:guarded.generatedAt}:null},
{id:'build_artifacts_present',ok:missingArtifacts.length===0&&Boolean(guarded?.artifacts?.ready),evidence:{missingArtifacts,buildIdMtime:statTime('.next/BUILD_ID')}},
{id:'live_smoke_after_current_build',ok:Boolean(live?.ok&&liveTime>=buildTime&&liveFailedChecks===0),evidence:live?{generatedAt:live.generatedAt,buildGeneratedAt:guarded?.generatedAt,checked:liveChecks.length,failed:liveFailedChecks}:null},
{id:'live_smoke_core_routes_covered',ok:missingLiveRoutes.length===0,evidence:{requiredLiveRoutes,missingLiveRoutes}},
{id:'auth_invite_smoke_after_current_build',ok:Boolean(auth?.ok&&authTime>=buildTime&&authFailedChecks===0&&(auth?.summary?.checked??0)>=8),evidence:auth?{generatedAt:auth.generatedAt,buildGeneratedAt:guarded?.generatedAt,summary:auth.summary,failed:authFailedChecks}:null},
{id:'no_ai_payment_verified_fake_added',ok:Boolean(policy.noAiPaymentVerifiedFakeAdded&&guarded?.noAiPaymentVerifiedFakeAdded!==false&&auth?.noAiPaymentVerifiedFakeAdded!==false),evidence:true}
];
const failedLocalChecks=checks.filter(c=>!c.ok).map(c=>c.id),localP0Closed=failedLocalChecks.length===0,node24RuntimeVerified=actualNodeMajor===targetMajor,p1SourceWorkAllowed=localP0Closed,publicP1RolloutAllowed=localP0Closed&&hostedFreshEnough,warnings=[];
if(!node24RuntimeVerified)warnings.push(`Current command ran on Node ${process.versions.node}; Node 24 target is source-aligned but runtime execution on Node 24 is not proven in this container.`);
if(!hostedFreshEnough)warnings.push('Hosted/public rollout remains blocked until fresh APP_URL/NEXT_PUBLIC_APP_URL strict URL smoke passes after this build.');
if(verifyRelease?.appUrlPresent===false)warnings.push('verify:release skipped URL smoke because APP_URL/NEXT_PUBLIC_APP_URL was not provided.');
const report={ok:localP0Closed,generatedAt:new Date().toISOString(),repoVersion:pkg.version||null,batch:policy.batch||'Batch126 - P0 Local Runtime Closure Hardening',localP0Closed,p1SourceWorkAllowed,publicP1RolloutAllowed,node24RuntimeVerified,currentNodeVersion:process.versions.node,hostedFreshEnough,checks,failedLocalChecks,warnings,noAiPaymentVerifiedFakeAdded:true,nextBatchRecommendation:publicP1RolloutAllowed?'P1 Account/Role/Admin Foundation can proceed with hosted proof.':'P1 source work may proceed only if localP0Closed is true; public rollout remains blocked until hosted smoke passes.',note:'Batch126 strengthens local P0 evidence freshness. It separates local P0 closure, Node 24 runtime proof, and hosted/public rollout proof.'};
fs.mkdirSync(path.dirname(artifactPath),{recursive:true});fs.writeFileSync(path.join(root,artifactPath),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));process.exit(report.ok?0:1);
