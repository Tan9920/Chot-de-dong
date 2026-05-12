export function buildAcademicDossierSummary(input: any = {}, ..._args: any[]) {
  return { generatedAt: new Date().toISOString(), packs: [], summary: { total: 0, blockers: 0 }, ...input };
}
export function buildAcademicPackDossierTemplate(pack: any = {}, ..._args: any[]) {
  return { packId: pack.id || 'demo-pack', fields: [], note: 'Demo template.' };
}
