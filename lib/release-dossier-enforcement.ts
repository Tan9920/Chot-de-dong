export function extractReleaseDossierFlags(input: any = {}) { return input.releaseDossierFlags || {}; }
export async function enforceReleaseDossierForExport(target: any, _user?: any, _format?: string, _flags?: any) {
  return { target, snapshotId: null, downgradedToDraft: false, summary: { decision: 'allow_demo_export', blockerCount: 0, warningCount: 1 } };
}
