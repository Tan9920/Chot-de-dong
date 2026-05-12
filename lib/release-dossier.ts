export type ReleaseDossierAudience = 'teacher_private' | 'department_review' | 'school_internal' | 'public_community' | 'public_marketing';
export type ReleaseDossierSubjectType = 'lesson_plan' | 'community_resource' | 'legal_asset' | 'school_release' | 'marketing_claim';
let snapshots: any[] = [];
export function buildReleaseDossier(input: any = {}) { return { id: 'dossier-' + Date.now(), generatedAt: new Date().toISOString(), decision: 'demo_review_required', blockers: [], warnings: ['Demo source-level; cần kiểm tra chuyên môn/pháp lý.'], ...input }; }
export function buildReleaseDossierLines(dossier: any = {}, _options?: any) { return [`Decision: ${dossier.decision || 'demo_review_required'}`, 'Warning: seed/scaffold chưa verified.']; }
export async function saveReleaseDossierSnapshot(input: any = {}, _user?: any) { const snapshot = { id: 'snapshot-' + Date.now(), ...input, createdAt: new Date().toISOString() }; snapshots.unshift(snapshot); return snapshot; }
export async function readReleaseDossierSnapshots() { return snapshots; }
