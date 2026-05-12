import releaseDossier from '@/data/academic-release-dry-run-dossier.json';
import registry from '@/data/subject-data-registry.json';
import sourceSubmissions from '@/data/academic-source-pack-submissions.json';
import curriculumMatrix from '@/data/curriculum-compatibility-matrix.json';
import { evaluateAcademicSourcePack } from './academic-source-intake';
import { evaluateAcademicCopyrightCompliance, buildAcademicCopyrightComplianceReport } from './academic-copyright-compliance';
import { buildAcademicVerificationReadinessReport } from './academic-verification-accelerator';

function asText(value: unknown) { return String(value ?? '').trim(); }
function asArray(value: unknown): any[] { return Array.isArray(value) ? value : []; }
function hasText(value: unknown) { return asText(value).length > 0; }
function registryRecord(scopeId: string) { return asArray((registry as any).records).find((r) => asText(r.id) === scopeId); }
function sourcePack(scope: any) { return asArray((sourceSubmissions as any).items).find((s) => asText(s.id) === asText(scope.sourcePackId)) || asArray((sourceSubmissions as any).items).find((s) => asText(s.scopeId) === asText(scope.scopeId)); }
function matrixMatches(scope: any) { return asArray((curriculumMatrix as any).records).filter((m) => asText(m.grade) === asText(scope.grade) && asText(m.subject).toLowerCase() === asText(scope.subject).toLowerCase()); }
function gate(id: string, status: 'pass'|'fail'|'warning', evidence: string, nextAction: string) { return { id, status, evidence, nextAction }; }

export function evaluateAcademicReleaseDryRunCandidate(scope: any = {}) {
  const pack = sourcePack(scope);
  const record = registryRecord(asText(scope.scopeId));
  const srcEval = evaluateAcademicSourcePack(pack || scope);
  const copyEval = evaluateAcademicCopyrightCompliance({ ...(pack || scope), publicReleaseRequested: true });
  const academicReviewer = hasText(pack?.reviewerId) && hasText(pack?.reviewerRole) && hasText(pack?.reviewerSignoffAt);
  const legalReviewer = hasText(pack?.legalReviewerId) && hasText(pack?.legalReviewerSignoffAt);
  const approvedRefs = asArray(pack?.approvedReferences).length;
  const exportLabel = hasText(pack?.exportComplianceLabel) && asText(pack?.exportComplianceLabel) !== 'source_pack_draft_not_for_deep_content';
  const currentLaw = pack?.currentLawCheckComplete === true;
  const deepStillBlocked = !Boolean(record?.contentDepthAllowed) && !['verified','approved_for_release'].includes(asText(record?.sourceStatus));
  const gates = [
    gate('registry_scope_exists', record ? 'pass' : 'fail', record ? `registry:${record.id}` : 'missing registry', 'Đối chiếu scope registry trước release.'),
    gate('source_pack_exists', pack ? 'pass' : 'fail', pack ? `sourcePack:${pack.id}` : 'missing source pack', 'Tạo source pack hợp pháp.'),
    gate('source_pack_ready_for_reviewed_candidate', srcEval.readyForReviewedCandidate ? 'pass' : 'fail', `blockers=${srcEval.blockers.map((b:any)=>b.label).join(',') || 'none'}`, 'Bổ sung metadata/license/attribution/takedown/reviewer/approved refs.'),
    gate('copyright_legal_ready', copyEval.legalReadyForReviewedCandidate ? 'pass' : 'fail', `stage=${copyEval.evaluatedStage}; blockers=${copyEval.blockers.map((b:any)=>b.label).join(',') || 'none'}`, 'Giữ legal_hold cho tới khi pass copyright gate.'),
    gate('current_law_check_complete', currentLaw ? 'pass' : 'fail', currentLaw ? 'currentLawCheckComplete=true' : 'currentLawCheckComplete chưa true', 'Legal reviewer kiểm tra pháp lý hiện hành.'),
    gate('academic_reviewer_signoff', academicReviewer ? 'pass' : 'fail', academicReviewer ? String(pack?.reviewerId) : 'missing academic reviewer signoff', 'Cần reviewer chuyên môn thật.'),
    gate('legal_reviewer_signoff', legalReviewer ? 'pass' : 'fail', legalReviewer ? String(pack?.legalReviewerId) : 'missing legal reviewer signoff', 'Cần legal reviewer/takedown owner thật.'),
    gate('approved_reference_count', approvedRefs >= 1 ? 'pass' : 'fail', `approvedReferences=${approvedRefs}`, 'Thêm approved references hợp pháp.'),
    gate('export_label_ready', exportLabel ? 'pass' : 'fail', asText(pack?.exportComplianceLabel) || 'missing', 'DOCX/PDF phải ghi data/copyright/release label.'),
    gate('no_deep_content_without_verified_release', deepStillBlocked ? 'pass' : 'fail', record ? `sourceStatus=${record.sourceStatus}; contentDepthAllowed=${record.contentDepthAllowed}` : 'registry missing', 'Chưa verified thì luôn safe_frame_only.'),
    gate('audit_log_ready', 'warning', 'academic-release-dry-run-last-run.json can be written; registryMutationPolicy.allowedNow=false', 'Ghi artifact, không mutate registry.'),
    gate('curriculum_matrix_crosscheck', 'warning', `matrixMatches=${matrixMatches(scope).length}`, 'Chỉ cảnh báo chọn bài/chủ đề; không nâng verified.')
  ];
  const failed = gates.filter((g) => g.status === 'fail');
  const releaseReadyDryRunOnly = failed.length === 0 && copyEval.legalReadyForReviewedCandidate && srcEval.readyForReviewedCandidate && currentLaw && academicReviewer && legalReviewer;
  return { scopeId: asText(scope.scopeId), sourcePackId: asText(scope.sourcePackId), grade: asText(scope.grade), subject: asText(scope.subject), topic: asText(scope.topic), registrySnapshot: record ? { sourceStatus: record.sourceStatus, reviewStatus: record.reviewStatus, supportLevel: record.supportLevel, releaseTier: record.releaseTier, contentDepthAllowed: Boolean(record.contentDepthAllowed), safeLessonMode: record.safeLessonMode } : null, sourceEvaluation: srcEval, copyrightEvaluation: copyEval, matrixCrosscheck: { matches: matrixMatches(scope).length, contentDepthAllowedMatches: matrixMatches(scope).filter((m:any)=>m.contentDepthAllowed).length }, gates, hardFailedGateIds: failed.map((g)=>g.id), releaseReadyDryRunOnly, decision: releaseReadyDryRunOnly ? 'release_ready_dry_run_only_no_registry_mutation' : 'blocked_safe_frame_only', canMutateRegistry: false, canSetReviewed: false, canSetVerified: false, canAllowDeepContent: false, teacherSafeFallback: 'Batch113 chỉ dry-run release. Scope chưa đủ gate thì chỉ dựng khung giáo án an toàn.', nextAction: releaseReadyDryRunOnly ? 'Làm batch release riêng có bằng chứng thật.' : 'Không release; hoàn thiện source/legal/reviewer/export gates.' };
}

export function buildAcademicReleaseDryRunReport() {
  const candidates = asArray((releaseDossier as any).pilotScopes).map(evaluateAcademicReleaseDryRunCandidate);
  const records = asArray((registry as any).records);
  const fake = records.filter((r:any) => ['verified','approved_for_release'].includes(r.sourceStatus) || r.contentDepthAllowed);
  const verify = buildAcademicVerificationReadinessReport();
  const copy = buildAcademicCopyrightComplianceReport();
  return { ok: true, batch: 'Batch113 — First Source Pack Pilot Dossier & Legal Release Dry-run', version: (releaseDossier as any).version, generatedAt: new Date().toISOString(), status: 'release_dry_run_ready_registry_unchanged_safe_frame_only', plainLanguageStatus: 'Đã tạo dry-run release cho một số scope nhỏ; hiện vẫn chặn release vì thiếu source/legal/reviewer/export gates.', metrics: { totalAcademicScopes: records.length, pilotScopes: candidates.length, blockedPilotScopes: candidates.filter((c)=>c.decision==='blocked_safe_frame_only').length, releaseReadyDryRunOnlyScopes: candidates.filter((c)=>c.releaseReadyDryRunOnly).length, legalReadySourcePacks: copy.metrics.legalReadyForReviewedCandidateSourcePacks, verifiedOrApprovedScopes: verify.metrics.verifiedOrApprovedScopes, deepContentAllowedScopes: verify.metrics.deepContentAllowedScopes, registryMutationsInBatch113: 0, fakeVerifiedCreated: 0, fakeContentDepthCreated: fake.filter((r:any)=>r.contentDepthAllowed && !['verified','approved_for_release'].includes(r.sourceStatus)).length }, releaseDossier, candidates, allowedClaims: ['Batch113 có release dry-run board cho scope pilot nhỏ.','Batch113 kiểm tra gate trước khi nâng reviewed/verified.','Batch113 không mutate registry, không tạo verified giả và không bật contentDepthAllowed.'], forbiddenClaims: ['Không nói scope pilot đã reviewed/verified thật.','Không nói legal-ready nếu source pack còn thiếu gate.','Không mở câu hỏi, đáp án, Casio hoặc nội dung sâu trong dry-run.'], nextSafeBatchAfterEvidence: 'Batch114 Single Scope Reviewed Release Candidate nếu có bằng chứng thật cho tối đa 1 scope.' };
}
export function buildAcademicReleaseDryRunBoard() { return { report: buildAcademicReleaseDryRunReport(), adminWarning: 'Board này chỉ là release dry-run. Không auto-release, không fake verified, không auto-public community resource.', teacherWarning: 'Nếu dry-run chưa pass đủ gate, giáo viên chỉ nhận khung an toàn.', registryMutationGuard: (releaseDossier as any).registryMutationPolicy }; }
